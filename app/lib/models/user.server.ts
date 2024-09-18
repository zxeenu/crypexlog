import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { simpleEncrypt } from "~/lib/crypto.server";
import { db } from "~/lib/db.server";
import { env } from "~/lib/env.server";

export const userModel = {
  mutation: {
    create: async ({
      userName,
      password,
    }: {
      userName: string;
      password: string;
    }) => {
      const saltRounds = bcrypt.genSaltSync(10);

      const publicId = nanoid();

      const pepper = env("PASSWORD_PEPPER_KEY");
      const pepperedPassword = await simpleEncrypt(password, pepper);

      const hash = bcrypt.hashSync(pepperedPassword, saltRounds);

      console.log({
        pepperedPassword,
        hash,
      });

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
