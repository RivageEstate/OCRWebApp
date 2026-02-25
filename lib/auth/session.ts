import { isValidUuid } from "@/lib/validation/uuid";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

// Temporary auth adapter for initial API development.
// Replace this with NextAuth session integration in the next step.
export function requireUserId(request: Request): string {
  const userId = request.headers.get("x-user-id")?.trim();
  if (!userId || !isValidUuid(userId)) {
    throw new UnauthorizedError();
  }
  return userId;
}
