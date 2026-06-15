import { describe, it, expect } from "vitest";
import { healthResponse } from "./index.js";

describe("healthResponse schema", () => {
  const valid = {
    status: "ok" as const,
    service: "homegrown-api",
    uptimeSeconds: 42,
    timestamp: "2026-06-11T00:00:00.000Z",
  };

  it("parses a valid health-check object", () => {
    const result = healthResponse.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("ok");
      expect(result.data.service).toBe("homegrown-api");
      expect(result.data.uptimeSeconds).toBe(42);
      expect(result.data.timestamp).toBe("2026-06-11T00:00:00.000Z");
    }
  });

  it("rejects an object with a wrong status literal", () => {
    const result = healthResponse.safeParse({ ...valid, status: "error" });
    expect(result.success).toBe(false);
  });

  it("rejects an object with a missing required field", () => {
    const { service: _omitted, ...withoutService } = valid;
    const result = healthResponse.safeParse(withoutService);
    expect(result.success).toBe(false);
  });

  it("rejects an object where uptimeSeconds is negative", () => {
    const result = healthResponse.safeParse({ ...valid, uptimeSeconds: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects an object where a field has the wrong type", () => {
    const result = healthResponse.safeParse({ ...valid, uptimeSeconds: "not-a-number" });
    expect(result.success).toBe(false);
  });
});
