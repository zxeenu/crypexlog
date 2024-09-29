import { Prisma } from "@prisma/client";
import { db } from "~/lib/db.server";
import { DbPaginator } from "~/lib/utils";

export const sellLogModel = {
  data: {
    findOne: async ({ id, created_by }: { id: number; created_by: number }) => {
      return await db.sellLog.findFirst({
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
      filters,
    }: {
      pagination: DbPaginator;
      created_by: number;
      filters?: {
        batch_code?: string;
      };
    }) => {
      let query: Prisma.SellLogWhereInput = {
        deleted_at: null,
        created_by: created_by,
      };

      if (filters?.batch_code) {
        query = {
          ...query,
          batchSellAction: {
            batch_code: filters.batch_code,
          },
        };
      }

      let records = await db.sellLog.count({
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

      const data = await db.sellLog.findMany({
        where: query,
        orderBy: {
          created_at: "desc",
        },
        include: {
          buyLog: {
            select: {
              balance_qty: true,
              id: true,
              buy_item: true,
            },
          },
          batchSellAction: true,
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
    create: async ({ data }: { data: Prisma.SellLogCreateInput }) => {
      return await db.sellLog.create({
        data: data,
      });
    },
    update: async ({
      id,
      data,
    }: {
      id: number;
      data: Prisma.SellLogUpdateInput;
    }) => {
      return await db.sellLog.update({
        where: {
          id: id,
        },
        data: data,
      });
    },
    softDelete: async ({ id }: { id: number }) => {
      return await db.sellLog.update({
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
