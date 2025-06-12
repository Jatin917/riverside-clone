import { prisma } from "@repo/db";
import { nanoid } from 'nanoid';
import { HTTP_STATUS } from "../../lib/types";

export const getStudio = async (req: Request, res: Response) => {
  try {
    if(!req.body) return;
    const userId: string = req.body.userId || "";

    if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing userId' });
    }

    let studio = await prisma.studio.findFirst({
      where: { ownerId: userId },
    });

    if (!studio) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      if (!user || !user.name) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'User not found' });
      }

      const parsedName = user.name.trim().toLowerCase().replace(/\s+/g, '-');
      const slugId = `${parsedName}-${nanoid(6)}`;

      studio = await prisma.studio.create({
        data: {
          name: user.name,
          ownerId: userId,
          slug: slugId,
        },
      });
    }

    return res.status(HTTP_STATUS.OK).json({name:studio.name, slugId: studio.slug });
  } catch (error) {
    console.error((error as Error).message);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: (error as Error).message });
  }
}