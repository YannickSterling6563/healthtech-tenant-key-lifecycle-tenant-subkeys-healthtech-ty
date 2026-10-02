import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import { InfraiClient, InfraiError } from "./infrai_client.js";
import { appointmentSchema, planAppointmentReminder } from "./appointment_notifications.js";
import {
  offboardTenant,
  offboardTenantSchema,
  onboardTenant,
  onboardTenantSchema
} from "./tenant_accounts.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const infrai = new InfraiClient(apiKey);
const port = Number(process.env.PORT ?? 3000);

createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/tenants/onboard") {
      return send(response, 201, await onboardTenant(infrai, onboardTenantSchema.parse(await readJson(request))));
    }
    if (request.method === "POST" && request.url === "/tenants/offboard") {
      return send(response, 200, await offboardTenant(infrai, offboardTenantSchema.parse(await readJson(request))));
    }
    if (request.method === "POST" && request.url === "/appointments/reminder-plan") {
      const appointment = appointmentSchema.parse(await readJson(request));
      return send(response, 200, planAppointmentReminder(appointment));
    }
    return send(response, 404, { error: "Route not found" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return send(response, 400, { error: "Invalid request body", issues: error.issues });
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      return send(response, status, { error: error.code, message: error.message });
    }
    console.error(error);
    return send(response, 500, { error: "Internal error" });
  }
}).listen(port, () => {
  console.log(`Tenant gateway listening on http://localhost:${port}`);
});

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 64_000) throw new Error("Request body is too large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}
