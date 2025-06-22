import { prisma } from "@repo/db";
import { nanoid } from 'nanoid';
import { HTTP_STATUS } from "../../lib/types";
import { Request, Response } from "express";

export const getStudio = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing request body' });
    }

    const email: string = req.body.email;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing email' });
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "No user found" });
    }

    const userId = user.id;
    let studio = await prisma.studio.findFirst({
      where: { ownerId: userId },
    });

    if (!studio) {
      const parsedName = user.name.trim().toLowerCase().replace(/\s+/g, '-');
      const slugId = `${parsedName}-${nanoid(6)}`;

      studio = await prisma.studio.create({
        data: {
          name: user.name,
          ownerId: userId,
          slugId: slugId,
        },
      });
    }

    return res.status(HTTP_STATUS.OK).json({ name: studio.name, slugId: studio.slugId });
  } catch (error) {
    console.error("GetStudio error:", (error as Error).message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};
