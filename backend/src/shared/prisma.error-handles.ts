import { Prisma } from "backend/src/prisma/generated/prisma/client";

export async function handlePrismaNotFound<Right, Left>(fn: () => Promise<Right>, onCaught: (error: Prisma.PrismaClientKnownRequestError) => Promise<Left>): Promise<Right | Left> {
  try {
    return await fn();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return await onCaught(error)
    }
    throw error;
  }
}
