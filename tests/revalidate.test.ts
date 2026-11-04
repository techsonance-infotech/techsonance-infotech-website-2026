import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../app/api/revalidate/route";
import * as envModule from "../lib/env";

const mockRevalidateTag = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

describe("API /api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      REVALIDATE_SECRET: "test-secret-12345",
    } as ReturnType<typeof envModule.getEnv>);
  });

  it("should return 401 when x-revalidate-secret header is missing", async () => {
    const req = new Request("http://localhost:3000/api/revalidate", {
      method: "POST",
      body: JSON.stringify({ tags: ["posts"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Unauthorized");
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("should return 401 when x-revalidate-secret header is invalid", async () => {
    const req = new Request("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "x-revalidate-secret": "wrong-secret",
      },
      body: JSON.stringify({ tags: ["posts"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Unauthorized");
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("should return 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "x-revalidate-secret": "test-secret-12345",
      },
      body: "invalid-json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid JSON body");
  });

  it("should return 400 when tags array is empty or missing", async () => {
    const req = new Request("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "x-revalidate-secret": "test-secret-12345",
      },
      body: JSON.stringify({ tags: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
  });

  it("should successfully revalidate all requested tags and return 200", async () => {
    const req = new Request("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "x-revalidate-secret": "test-secret-12345",
      },
      body: JSON.stringify({ tags: ["posts", "post:ai-engineering-2026"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.revalidated).toEqual(["posts", "post:ai-engineering-2026"]);
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
    expect(mockRevalidateTag).toHaveBeenCalledWith("posts", "default");
    expect(mockRevalidateTag).toHaveBeenCalledWith("post:ai-engineering-2026", "default");
  });
});
