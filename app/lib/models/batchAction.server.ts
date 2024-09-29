import { Prisma } from "@prisma/client";
import { db } from "~/lib/db.server";
import { DbPaginator } from "~/lib/utils";

export const batchActionModel = {
  data: {
    pages: async ({
      pagination,
      created_by,
    }: {
      pagination: DbPaginator;
      created_by: number;
    }) => {
      const query: Prisma.BatchSellActionWhereInput = {
        created_by: created_by,
      };

      let records = await db.batchSellAction.count({
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

      const data = await db.batchSellAction.findMany({
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
};
