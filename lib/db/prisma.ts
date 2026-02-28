import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  __prismaSignalRegistered?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Register graceful shutdown handlers only once to avoid duplicate listeners on hot reload.
if (!globalForPrisma.__prismaSignalRegistered) {
  globalForPrisma.__prismaSignalRegistered = true;
  const disconnect = () => {
    prisma.$disconnect().catch(console.error);
  };
  process.once("SIGTERM", disconnect);
  process.once("SIGINT", disconnect);
}
