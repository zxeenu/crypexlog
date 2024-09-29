import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "~/lib/db.server";
import { DbPaginator } from "~/lib/utils";

export const buyLogModel = {
  data: {
    search: async ({
      search,
      include_sold_out,
      created_by,
    }: {
      search?: string;
      include_sold_out: boolean;
      created_by: number;
    }) => {
      let query: Prisma.BuyLogWhereInput = {
        deleted_at: null,
        created_by: created_by,
      };

      if (!include_sold_out) {
        query = {
          ...query,
          balance_qty: {
            gt: 0,
          },
        };
      }

      let optionalFilters: Prisma.BuyLogWhereInput["OR"] = [];

      if (search) {
        optionalFilters.push({
          remarks: {
            contains: search,
          },
        });
      }

      if (search) {
        const searchAsNum = z.coerce.number().safeParse(search);
        if (searchAsNum.success) {
          optionalFilters.push({
            buy_rate: {
              gte: searchAsNum.data,
            },
          });
        }
      }

      if (optionalFilters.length > 0) {
        query = {
          ...query,
          AND: {
            OR: optionalFilters,
          },
        };
      }

      const data = await db.buyLog.findMany({
        where: query,
        orderBy: {
          created_at: "desc",
        },
      });

      return data;
    },
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
      filters,
    }: {
      pagination: DbPaginator;
      created_by: number;
      filters?: {
        buy_log_id?: number;
      };
    }) => {
      let query: Prisma.BuyLogWhereInput = {
        deleted_at: null,
        created_by: created_by,
      };

      if (filters?.buy_log_id) {
        query = {
          ...query,
          id: filters.buy_log_id,
        };
      }

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
    syncBalanceQty: async ({ id }: { id: number }) => {
      const buyLog = await db.buyLog.findFirst({
        where: {
          id: id,
          deleted_at: null,
        },
      });

      if (!buyLog) {
        throw new Error("Buy Log could not be found");
      }

      const sellLogs = await db.sellLog.findMany({
        where: {
          deleted_at: null,
          buy_log_id: id,
        },
        select: {
          id: true,
          sell_qty: true,
        },
      });

      if (sellLogs.length === 0) {
        // if no sell records, revert to origial qty
        await db.buyLog.update({
          where: {
            id: id,
          },
          data: {
            balance_qty: buyLog.buy_qty,
          },
        });
      }

      const sellQtyList = sellLogs.map((x) => x.sell_qty);
      const totalSellQty = sellQtyList.reduce((acc, curr) => acc + curr, 0);

      if (totalSellQty <= 0) {
        return;
      }

      const remainingQty = buyLog.buy_qty - totalSellQty;

      await db.buyLog.update({
        where: {
          id: id,
        },
        data: {
          balance_qty: remainingQty,
        },
      });
    },
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
