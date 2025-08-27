import prisma from "./db.server";

export function getUserById (userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}