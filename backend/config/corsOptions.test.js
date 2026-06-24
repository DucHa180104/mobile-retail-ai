import { describe, expect, it, vi } from "vitest";
import { createCorsOptions, parseAllowedOrigins } from "./corsOptions.js";

describe("S3 - CORS whitelist configuration", () => {
  it("should parse allowed origins from env string", () => {
    expect(
      parseAllowedOrigins("http://localhost:5173, http://localhost:5174, ")
    ).toEqual(["http://localhost:5173", "http://localhost:5174"]);
  });

  it("should allow request when origin is in whitelist", () => {
    const callback = vi.fn();
    const corsOptions = createCorsOptions(["http://localhost:5173"]);

    corsOptions.origin("http://localhost:5173", callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("should allow request without origin for tools like Postman or Supertest", () => {
    const callback = vi.fn();
    const corsOptions = createCorsOptions(["http://localhost:5173"]);

    corsOptions.origin(undefined, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("should reject request from origin outside whitelist", () => {
    const callback = vi.fn();
    const corsOptions = createCorsOptions(["http://localhost:5173"]);

    corsOptions.origin("http://evil-site.com", callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(callback.mock.calls[0][0].message).toBe("CORS origin is not allowed");
  });
});
