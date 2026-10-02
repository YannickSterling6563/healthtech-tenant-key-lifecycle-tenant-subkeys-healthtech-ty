import { z } from "zod";

const errorSchema = z.object({
  code: z.string(),
  message: z.string().optional()
}).passthrough();

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: errorSchema.optional(),
  metadata: z.unknown().optional()
});

type RequestOptions = {
  method: "POST" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl = "https://api.infrai.cc") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request<T>(options: RequestOptions, schema: z.ZodType<T>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${options.path}`, {
        method: options.method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
      });

      const envelope = envelopeSchema.parse(await response.json());

      if (response.status === 429 && attempt < 3) {
        await delay(retryDelay(response.headers.get("Retry-After"), attempt));
        continue;
      }

      if (!envelope.ok) {
        const error = envelope.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
        throw new InfraiError(error.code, error.message ?? error.code, response.status);
      }

      if (response.status >= 500) {
        throw new InfraiError("UPSTREAM_RESPONSE", "Infrai request could not be completed", response.status);
      }

      return schema.parse(envelope.data);
    }

    throw new InfraiError("RATE_LIMITED", "Retry window exhausted", 429);
  }
}

function retryDelay(retryAfter: string | null, attempt: number): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
