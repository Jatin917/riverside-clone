// lib/studio.ts
import { prisma } from "@repo/db";
import { nanoid } from "nanoid";

export async function getOrCreateStudioByEmail(email: string) {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) throw new Error("User not found");

  let studio = await prisma.studio.findFirst({
    where: { ownerId: user.id },
  });

  if (!studio) {
    const parsedName = user.name.trim().toLowerCase().replace(/\s+/g, '-');
    const slugId = `${parsedName}-${nanoid(6)}`;

    studio = await prisma.studio.create({
      data: {
        name: user.name,
        ownerId: user.id,
        slugId: slugId,
      },
    });
  }

  return studio;
}


