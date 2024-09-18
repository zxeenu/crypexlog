import { Prisma } from "@prisma/client";
import { json, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { z } from "zod";
import { authUser } from "~/lib/auth.server";
import { buyLogModel } from "~/lib/models/buyLog.server";
import { validateSearchParams } from "~/lib/validation";

const searchSchema = z.object({
  search: z.coerce.string(),
  include_sold_out: z
    .string()
    .transform((x) => x === "true")
    .pipe(z.coerce.boolean()),
});

type InputErrors = z.inferFormattedError<typeof searchSchema>;

type ActionResponse =
  | {
      status: "error";
      error: InputErrors;
    }
  | {
      status: "success";
      data: Prisma.PromiseReturnType<typeof buyLogModel.data.search>;
    };

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<TypedResponse<ActionResponse>> {
  const user = await authUser({
    request,
  });

  const validatedSearchParams = validateSearchParams(request, searchSchema);

  if (!validatedSearchParams.success) {
    return json(
      {
        status: "error",
        error: validatedSearchParams.error.format(),
      },
      {
        status: 400,
      }
    );
  }

  const data = await buyLogModel.data.search({
    include_sold_out: validatedSearchParams.data.include_sold_out,
    search: validatedSearchParams.data.search,
    created_by: user.id,
  });

  return json({ data, status: "success" });
}
