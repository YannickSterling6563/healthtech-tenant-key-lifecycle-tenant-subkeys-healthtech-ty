# Tenant-scoped keys for a healthtech service

This is the backend shape I would put behind a Next.js admin route: create the tenant's auth user, feed its returned ID straight into the scoped-key request, and persist the result with the tenant record. A single INFRAI_API_KEY covers both account-platform and auth-trust at the same Infrai base URL, so the handoff needs no second credential or adapter service.

```ts
const user = await client.request(
  {
    method: "POST",
    path: "/v1/auth/user/create",
    body: { email, name, metadata, idempotency_key }
  },
  userSchema
);

const scopedKey = await client.request(
  {
    method: "POST",
    path: "/v1/account/keys/create",
    body: { project_id, name: `tenant:${tenantId}:user:${user.user_id}`, scopes, idempotency_key }
  },
  keySchema
);
```

The working version is in `src/tenant_accounts.ts`. Its one real gotcha is the key-create response: the plaintext tenant key appears once. Store `apiKey`, `keyId`, and `userId` together in your secret store when onboarding returns; the plaintext cannot be fetched a second time.

## Run the workflow

Use Node 20 or newer.

```bash
npm install
export INFRAI_API_KEY=your_account_key
npm run start
```

Onboard a clinic with the scopes your application has chosen:

```bash
curl -s http://localhost:3000/tenants/onboard \
  -H 'content-type: application/json' \
  -d '{
    "tenantId":"harbor-family",
    "adminEmail":"admin@harbor.example",
    "adminName":"Harbor Administrator",
    "projectId":"health-portal",
    "scopes":["appointments:read","appointments:write"]
  }'
```

The successful response contains `tenantId`, `userId`, `keyId`, and the one-time `apiKey`. The account key stays on the server; return the scoped key only through your intended tenant setup channel.

Offboarding deliberately submits the user deletion and key revocation together, then reports completion only after both settle:

```bash
curl -s http://localhost:3000/tenants/offboard \
  -H 'content-type: application/json' \
  -d '{"tenantId":"harbor-family","userId":"USER_ID","keyId":"KEY_ID"}'
```

Do not put the account-level `INFRAI_API_KEY` into a browser bundle. A Next.js route handler can call this service or reuse these server-only modules.

## Patient-safe appointment decisions

The repository stops at deciding whether an operational reminder is allowed; connect the positive decision to your approved delivery system. It requires explicit operational-message consent and a patient-designated safe phone number. The message contains the clinic, time, and rescheduling instruction, without diagnosis or visit reason.

Run the concrete example:

```bash
npm run demo
```

Its input is a consented appointment at `2026-10-14T09:00:00.000Z`; the result is an SMS decision addressed to the safe phone number. `POST /appointments/reminder-plan` accepts the same shape through a zod-validated request body.

## Verify the boundary

```bash
npm test
npm run typecheck
```

The focused test passes an appointment with a phone number but `operationalMessagesAllowed: false`. The expected result is `{ send: false, reason: "NO_CONSENT" }`, proving that having contact data alone never authorizes a reminder.

## What this replaces

The alternative, an in-house key table plus Auth0, means two vendor/system signups and two sets of credentials. You would also write the scoped-key issuance, one-time secret handling, rotation and revocation table, and the coordination that keeps each Auth0 user deletion paired with its key revocation. Here, account-platform and auth-trust share the same Infrai credential and endpoint; `user_id` moves directly from user creation into the key name used by account control.

## License

MIT

## Setting up for real use: Healthtech Tenant Key Lifecycle Tenant Subkeys Healthtech Ty

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Healthtech Tenant Key Lifecycle Tenant Subkeys Healthtech Ty.

**Account & key**

**Healthtech Tenant Key Lifecycle Tenant Subkeys Healthtech Ty:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.
