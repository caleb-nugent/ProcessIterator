import { prisma } from "./prisma";

let cached: string | null = null;

export async function getDefaultUserId(): Promise<string> {
  if (cached) return cached;
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("No users in database");
  cached = user.id;
  return cached;
}
