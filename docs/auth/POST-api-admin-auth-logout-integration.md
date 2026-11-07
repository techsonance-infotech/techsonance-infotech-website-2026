# POST `/api/admin/auth/logout` — Integration Guide

**Domain:** Admin Governance & Authentication  
**Route file:** `app/api/admin/auth/logout/route.ts`  
**Contract:** `lib/contracts/admin-auth.contract.ts` (`adminLogoutContract`)  
**Cookie Managed:** `ts_admin_session`

---

## Overview

The `/api/admin/auth/logout` endpoint terminates the current administrator's session by clearing the server-side session cookie and dispatching an expired `Set-Cookie` header to the browser.

---

## Endpoint Details

### `POST /api/admin/auth/logout`

| Attribute       | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| **Auth**        | None required (clears session if present)                          |
| **Origin**      | Enforced — foreign cross-site origins → `403 Forbidden`            |
| **Cache**       | `private, no-store`                                                |
| **Cookie Expired**| `ts_admin_session` deleted from client browser                   |
| **Response**    | `200 OK` with `{ ok: true, data: { message }, message, success }`  |

---

## Request & Response Schemas

### Request Headers

```http
POST /api/admin/auth/logout HTTP/1.1
Host: techsonance.co.in
Content-Type: application/json
Origin: https://techsonance.co.in
```

### Request Body

None required (`noBody`).

### Response Schema (`200 OK`)

```json
{
  "ok": true,
  "data": {
    "message": "Signed out successfully"
  },
  "message": "Signed out successfully",
  "success": true
}
```

### Response Headers

```http
Set-Cookie: ts_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0
```

---

## HTTP Status Code & Error Matrix

| Status | Code Enum           | Message / Trigger                                                 |
| ------ | ------------------- | ----------------------------------------------------------------- |
| `200`  | —                   | Successfully logged out, cookie deleted                           |
| `403`  | `FORBIDDEN`         | Foreign origin header (`AUTH_ERRORS.FORBIDDEN_ORIGIN`)            |
| `500`  | `INTERNAL`          | Unexpected server failure                                         |

---

## TypeScript Client Example

```typescript
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export async function logoutAdmin(): Promise<void> {
  const response = await fetch(API_ENDPOINTS.ADMIN.AUTH.LOGOUT, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Logout failed");
  }

  // Session cookie is cleared by browser; redirect to login
  window.location.href = "/admin/login";
}
```

---

## Verification & Black-Box Execution

### Run Standalone Black-Box Script
```bash
npx tsx blackbox-testing/auth/verify_admin_auth_logout_blackbox.ts
```

### Run Vitest Integration Suite
```bash
npx vitest run tests/admin-auth-logout-blackbox.test.ts
```
