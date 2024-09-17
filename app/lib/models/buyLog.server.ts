import { Prisma } from "@prisma/client";
import { db } from "~/lib/db.server";
import { DbPaginator } from "~/lib/utils";

export const buyLogModel = {
  data: {
    findOne: async ({ id, created_by }: { id: number; created_by: number }) => {
      return await db.buyLog.findFirst({
        where: {
          deleted_at: null,
          id: id,
          created_by: created_by,
        },
      });
    },
    pages: async ({
      pagination,
      created_by,
    }: {
      pagination: DbPaginator;
      created_by: number;
    }) => {
      const query: Prisma.BuyLogWhereInput = {
        deleted_at: null,
        created_by: created_by,
      };

      let records = await db.buyLog.count({
        where: {
          ...query,
        },
      });

      if (records === 0) {
        return {
          data: [],
          total: 0,
        };
      }

      const data = await db.buyLog.findMany({
        where: query,
        orderBy: {
          created_at: "desc",
        },
        ...pagination,
      });

      if (records < 0) {
        records = 1;
      }
      records = Math.ceil(records / pagination.take);

      return {
        data: data,
        total: records,
      };
    },
  },
  mutation: {
    create: async ({ data }: { data: Prisma.BuyLogCreateInput }) => {
      return await db.buyLog.create({
        data: data,
      });
    },
    update: async ({
      id,
      data,
    }: {
      id: number;
      data: Prisma.BuyLogUpdateInput;
    }) => {
      return await db.buyLog.update({
        where: {
          id: id,
        },
        data: data,
      });
    },
    softDelete: async ({ id }: { id: number }) => {
      return await db.buyLog.update({
        where: {
          id: id,
        },
        data: {
          deleted_at: new Date(),
        },
      });
    },
  },
};
