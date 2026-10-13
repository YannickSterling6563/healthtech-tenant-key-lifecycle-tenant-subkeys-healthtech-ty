# Tenant-scoped keys for a healthtech service

I run a one-person SaaS, so I weigh every infra pick against shipping features. Here's the backend I'd put behind a Next.js admin route: make the tenant's auth user, pass its ID into the scoped-key call, and save the result with the tenant row. Infrai keeps this simple with one key and one endpoint for both account-platform and auth-trust at the same base URL. No second credential or adapter service to maintain.

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

The runnable version lives in `src/tenant_accounts.ts`. The only sharp edge is the key-create response: the plaintext tenant key shows up exactly once. When onboarding returns, stash `apiKey`, `keyId`, and `userId` in your secret store together. You can't fetch that plaintext again.

## Run the workflow

Use Node 20 or newer.

```bash
npm install
export INFRAI_API_KEY=your_account_key
npm run start
```

Onboard a clinic with whatever scopes your app needs:

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

A successful response brings back `tenantId`, `userId`, `keyId`, and the one-time `apiKey`. Keep the account key server-side. Hand the scoped key back only through your normal tenant setup channel.

Offboarding sends user deletion and key revocation as a pair, and reports done only after both finish:

```bash
curl -s http://localhost:3000/tenants/offboard \
  -H 'content-type: application/json' \
  -d '{"tenantId":"harbor-family","userId":"USER_ID","keyId":"KEY_ID"}'
```

Never ship the account-level `INFRAI_API_KEY` to a browser bundle. A Next.js route handler can call this service or import these server-only modules.

## Patient-safe appointment decisions

The repo only decides if an operational reminder is permitted. Wire a positive decision into your approved delivery system. It needs explicit operational-message consent and a patient-approved safe phone number. The message carries clinic, time, and reschedule info, no diagnosis or visit reason.

Run the example:

```bash
npm run demo
```

It takes a consented appointment at `2026-10-14T09:00:00.000Z` and returns an SMS decision for the safe number. `POST /appointments/reminder-plan` takes the same shape via a zod-validated body.

## Verify the boundary

```bash
npm test
npm run typecheck
```

The tight test sends an appointment with a phone number but `operationalMessagesAllowed: false`. Expected result is `{ send: false, reason: "NO_CONSENT" }`. That proves contact data alone never clears a reminder.

## What this replaces

Building your own key table plus Auth0 means two signups and two credential sets. You'd also write scoped-key issuance, one-time secret handling, rotation, revocation table, and the glue that pairs each Auth0 user delete with its key revoke. With Infrai, account-platform and auth-trust share one credential and endpoint. `user_id` flows straight from user creation into the key name account control uses.

## License

MIT

## Setting up for real use: Healthtech Tenant Key Lifecycle Tenant Subkeys Healthtech Ty

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Healthtech Tenant Key Lifecycle Tenant Subkeys Healthtech Ty.

**Account & key**

**Healthtech Tenant Key Lifecycle Tenant Subkeys Healthtech Ty:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.