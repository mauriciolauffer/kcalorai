import { describe, it, expect } from "vitest";
import {
  AppError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "./errors";

describe("Error classes", () => {
  it("AppError sets message, statusCode, and details", () => {
    const err = new AppError("oops", 500, { x: 1 });
    expect(err.message).toBe("oops");
    expect(err.statusCode).toBe(500);
    expect(err.details).toEqual({ x: 1 });
    expect(err.name).toBe("AppError");
  });

  it("AppError defaults statusCode to 500", () => {
    const err = new AppError("oops");
    expect(err.statusCode).toBe(500);
  });

  it("ConflictError sets statusCode to 409", () => {
    const err = new ConflictError("conflict");
    expect(err.statusCode).toBe(409);
    expect(err.name).toBe("ConflictError");
  });

  it("ValidationError sets statusCode to 400", () => {
    const err = new ValidationError("bad input");
    expect(err.statusCode).toBe(400);
  });

  it("UnauthorizedError sets statusCode to 401 and defaults message", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });

  it("ForbiddenError sets statusCode to 403 and defaults message", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("Forbidden");
  });

  it("NotFoundError sets statusCode to 404 and defaults message", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not Found");
  });
});
