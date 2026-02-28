import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId(_request: Request): Promise<string> {
  const session = await auth();
  if (!session?.userId) {
    throw new UnauthorizedError();
  }
  return session.userId;
}
