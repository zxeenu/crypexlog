import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "~/lib/db.server";

export const userModel = {
  mutation: {
    create: async ({
      userName,
      password,
    }: {
      userName: string;
      password: string;
    }) => {
      const publicId = nanoid();

      const saltRounds = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, saltRounds);

      return await db.user.create({
        data: {
          user_name: userName,
          public_id: publicId,
          userAuth: {
            create: {
              password: hash,
            },
          },
        },
      });
    },
  },
  data: {
    getUserByPublicId: async (publicId: string) => {
      return await db.user.findFirst({
        where: {
          public_id: publicId,
          deleted_at: null,
        },
      });
    },
    getUserHashAndPublicId: async (userName: string) => {
      const user = await db.user.findFirst({
        where: {
          user_name: userName,
        },
        select: {
          id: true,
          public_id: true,
          user_name: true,
          userAuth: {
            where: {
              deleted_at: null,
              blocked_at: null,
            },
            select: {
              password: true,
            },
            orderBy: {
              id: "desc",
            },
            take: 1,
          },
        },
      });
      return user;
    },
  },
};
