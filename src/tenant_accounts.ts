import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";

const userSchema = z.object({ user_id: z.string().min(1) }).passthrough();
const keySchema = z.object({
  key_id: z.string().min(1),
  key_secret: z.string().min(1)
}).passthrough();
const deletionSchema = z.unknown();

export const onboardTenantSchema = z.object({
  tenantId: z.string().min(1).max(80),
  adminEmail: z.string().email(),
  adminName: z.string().min(1).max(120),
  projectId: z.string().min(1).max(120),
  scopes: z.array(z.string().min(1)).min(1)
});

export const offboardTenantSchema = z.object({
  tenantId: z.string().min(1).max(80),
  userId: z.string().min(1),
  keyId: z.string().min(1)
});

export type OnboardTenant = z.infer<typeof onboardTenantSchema>;
export type OffboardTenant = z.infer<typeof offboardTenantSchema>;

export async function onboardTenant(client: InfraiClient, input: OnboardTenant) {
  const user = await client.request(
    {
      method: "POST",
      path: "/v1/auth/user/create",
      body: {
        email: input.adminEmail,
        name: input.adminName,
        metadata: { tenant_id: input.tenantId },
        idempotency_key: `tenant:${input.tenantId}:admin:v1`
      }
    },
    userSchema
  );

  const scopedKey = await client.request(
    {
      method: "POST",
      path: "/v1/account/keys/create",
      body: {
        project_id: input.projectId,
        name: `tenant:${input.tenantId}:user:${user.user_id}`,
        scopes: input.scopes,
        idempotency_key: `tenant:${input.tenantId}:key:v1`
      }
    },
    keySchema
  );

  return {
    tenantId: input.tenantId,
    userId: user.user_id,
    keyId: scopedKey.key_id,
    apiKey: scopedKey.key_secret
  };
}

export async function offboardTenant(client: InfraiClient, input: OffboardTenant) {
  const [userResult, keyResult] = await Promise.allSettled([
    client.request(
      { method: "DELETE", path: `/v1/auth/user/delete/${encodeURIComponent(input.userId)}` },
      deletionSchema
    ),
    client.request(
      { method: "DELETE", path: `/v1/account/keys/revoke/${encodeURIComponent(input.keyId)}` },
      deletionSchema
    )
  ]);

  if (userResult.status === "rejected") throw userResult.reason;
  if (keyResult.status === "rejected") throw keyResult.reason;

  return { tenantId: input.tenantId, userDeleted: true, keyRevoked: true };
}
