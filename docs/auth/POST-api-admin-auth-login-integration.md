# POST `/api/admin/auth/login` — Integration Guide

**Domain:** Admin Governance & Authentication  
**Route file:** `app/api/admin/auth/login/route.ts`  
**Contract:** `lib/contracts/admin-auth.contract.ts`  
**Service:** `lib/services/admin-auth.service.ts`  
**Repository:** `lib/repositories/admin-users.repository.ts`  
**DB table:** `ts_core_users` (`usersTable`)

---

## Overview

The `/api/admin/auth/login` endpoint provides secure credential verification, brute-force rate-limiting, password hashing verification (`scrypt`), session token issuance, and HTTP-only cookie dispatch for the TechSonance Studio Admin Platform.

---

## Endpoint Details

### `POST /api/admin/auth/login`

Verifies work email and password, creates an authenticated session, sets the `ts_admin_session` HTTP-only cookie, and returns the authenticated user's profile.

| Attribute       | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| **Auth**        | None (Public authentication endpoint)                              |
| **Origin**      | Enforced — foreign cross-site origins → `403 Forbidden`            |
| **Rate Limiting**| 5 attempts per 60 seconds per IP (`admin:login:${clientIp}`)       |
| **Cache**       | `private, no-store`                                                |
| **Cookie Issued**| `ts_admin_session` (HttpOnly, SameSite=Lax, Secure in Prod, 7 days)|
| **Response**    | `200 OK` with `{ ok: true, data: { user, message }, user, success }`|

---

## Request & Response Schemas

### Request Headers

```http
POST /api/admin/auth/login HTTP/1.1
Host: techsonance.co.in
Content-Type: application/json
Origin: https://techsonance.co.in
```

### Request Body Schema

Strict JSON object adhering to `adminLoginBodySchema`:

| Field      | Type     | Required | Constraints                               | Description                  |
| ---------- | -------- | -------- | ----------------------------------------- | ---------------------------- |
| `email`    | `string` | Yes      | Valid RFC 5322 email format, max 254 char | Admin work email address     |
| `password` | `string` | Yes      | Min 6 characters, max 128 characters      | Plaintext account password   |

```json
{
  "email": "admin@techsonance.co.in",
  "password": "CorrectHorseBatteryStaple123!"
}
```

### Response Schema (`200 OK`)

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "email": "admin@techsonance.co.in",
      "name": "Master Admin",
      "role": "owner"
    },
    "message": "Signed in successfully"
  },
  "user": {
    "id": "00000000-0000-0000-0000-000000000001",
    "email": "admin@techsonance.co.in",
    "name": "Master Admin",
    "role": "owner"
  },
  "message": "Signed in successfully",
  "success": true
}
```

### Set-Cookie Header

```http
Set-Cookie: ts_admin_session=<signed_base64_token>; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax
```

---

## HTTP Status Code & Error Matrix

| Status | Code Enum           | Message / Trigger                                                 |
| ------ | ------------------- | ----------------------------------------------------------------- |
| `200`  | —                   | Authentication successful, session issued                         |
| `401`  | `UNAUTHENTICATED`   | Invalid email or password (`AUTH_ERRORS.INVALID_CREDENTIALS`)     |
| `403`  | `FORBIDDEN`         | Foreign origin header or account is disabled (`ACCOUNT_DISABLED`) |
| `422`  | `VALIDATION`        | Malformed email, missing password, or password < 6 characters     |
| `429`  | `RATE_LIMITED`      | Too many login attempts (> 5 in 60s) from same IP address         |
| `500`  | `INTERNAL`          | Unexpected database or crypto failure                             |

---

## TypeScript Client Example

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

interface LoginCredentials {
  email: string;
  password: string;
}

export async function loginAdmin(credentials: LoginCredentials) {
  const response = await fetch(API_ENDPOINTS.ADMIN.AUTH.LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Required to store HTTP-only session cookie
    body: JSON.stringify(credentials),
  });

  const payload = await response.json();

  if (!response.ok) {
    const errorMsg = payload.error?.message || "Authentication failed";
    throw new Error(errorMsg);
  }

  return payload.data.user;
}
```

---

## Verification & Black-Box Execution

### Run Standalone Black-Box Script
```bash
npx tsx blackbox-testing/auth/verify_admin_auth_login_blackbox.ts
```

### Run Vitest Integration Suite
```bash
npx vitest run tests/admin-auth-login-blackbox.test.ts
```
