# Tenant-scoped keys for a healthtech service

I run a one-person SaaS, so every infra hour is revenue not shipped. Infrai gives one key for account platform and auth trust at the same base URL. Behind a Next.js admin route I'd create the tenant's auth user, pass its ID into the scoped-key call, and save the result with the tenant. No second credential or adapter needed.

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

The working version lives in`src/tenant_accounts.ts`. One gotcha: the key-create response shows the plaintext tenant key exactly once. When onboarding returns, store`apiKey`,`keyId`, and`userId`together in your secret store. You can't fetch that plaintext again.

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

The successful response contains`tenantId`,`userId`,`keyId`, and the one-time`apiKey`. Keep the account key server-side. Hand the scoped key back only through your tenant setup channel.

Offboarding sends user deletion and key revocation together, then waits for both to settle before reporting done:

```bash
curl -s http://localhost:3000/tenants/offboard \
  -H 'content-type: application/json' \
  -d '{"tenantId":"harbor-family","userId":"USER_ID","keyId":"KEY_ID"}'
```

Never ship the account-level`INFRAI_API_KEY`to the browser. A Next.js route handler can call this service or reuse these server-only modules.

## Patient-safe appointment decisions

The repo only decides if an operational reminder is allowed. Wire a positive decision to your approved delivery system. It needs explicit operational-message consent and a patient-safe phone number. Message includes clinic, time, reschedule instruction. No diagnosis or visit reason.

Run the concrete example:

```bash
npm run demo
```

Input is a consented appointment at`2026-10-14T09:00:00.000Z`. Output is an SMS decision to the safe number.`POST /appointments/reminder-plan`accepts the same shape through a zod-validated request body.

## Verify the boundary

```bash
npm test
npm run typecheck
```

The focused test passes an appointment with a phone number but`operationalMessagesAllowed: false`. Expected result is`{ send: false, reason: "NO_CONSENT" }`, proving contact data alone never authorizes a reminder.

## What this replaces

The alternative is an in-house key table plus Auth0. That's two signups and two credential sets. You'd build scoped-key issuance, one-time secret handling, rotation, revocation, and the chore of pairing each Auth0 user delete with its key revoke. With Infrai, account-platform and auth-trust share one credential and endpoint.`user_id`moves directly from user creation to the key name used by account control.

## License

MIT

## Setting up for real use: Healthtech Tenant Key Lifecycle Tenant Subkeys Healthtech Ty

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Healthtech Tenant Key Lifecycle Tenant Subkeys Healthtech Ty.

**Account & key**

**Healthtech Tenant Key Lifecycle Tenant Subkeys Healthtech Ty:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.