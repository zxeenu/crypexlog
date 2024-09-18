import {
  Box,
  Button,
  Card,
  ComboboxData,
  Drawer,
  Grid,
  Input,
  NumberInput,
  Select,
  Textarea,
  Title,
} from "@mantine/core";
import { DateInput, DateValue } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
  TypedResponse,
} from "@remix-run/node";
import {
  Form,
  json,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useValidationHook } from "~/hooks/validationHook";
import { authUser } from "~/lib/auth.server";
import { buyLogModel } from "~/lib/models/buyLog.server";
import { sellLogModel } from "~/lib/models/sellLog.server";
import { validateSearchParams } from "~/lib/validation";

const createSchema = z.object({
  sell_qty: z.coerce.number().gt(0),
  sell_rate: z.coerce.number(),
  sell_at: z.coerce.date(),
  remarks: z.string(),
});

type InputErrors = z.inferFormattedError<typeof createSchema>;

type ActionResponse =
  | {
      type: "input-error";
      issues: InputErrors;
    }
  | {
      type: "success";
    };

export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<ActionResponse>> {
  const user = await authUser({
    request,
  });

  const validatedParams = z
    .object({
      id: z.coerce.number().finite().nonnegative(),
    })
    .safeParse(params);

  if (!validatedParams.success) {
    throw new Error("Invalid Params");
  }

  const validatedSearchParams = validateSearchParams(
    request,
    z.object({
      mode: z.enum(["delete", "update"]),
    })
  );

  if (!validatedSearchParams.success) {
    throw new Error("Invalid Search Params");
  }

  const sellLog = await sellLogModel.data.findOne({
    id: validatedParams.data.id,
    created_by: user.id,
  });

  if (!sellLog) {
    throw new Error("Restricted Access3");
  }

  const form = await request.formData();
  const { _action, ...formData } = Object.fromEntries(form);

  if (_action === "update") {
    const validatedForm = createSchema.safeParse(formData);

    if (!validatedForm.success) {
      const error = validatedForm.error.format();
      return json({
        type: "input-error",
        issues: error,
      });
    }

    const sellLog = await sellLogModel.mutation.update({
      id: validatedParams.data.id,
      data: {
        sell_qty: validatedForm.data.sell_qty,
        sell_rate: validatedForm.data.sell_rate,
        sell_at: validatedForm.data.sell_at,
        remarks: validatedForm.data.remarks,
      },
    });

    await buyLogModel.mutation.syncBalanceQty({
      id: sellLog.buy_log_id,
    });

    return json({
      type: "success",
    });
  }

  if (_action === "delete") {
    const validatedForm = createSchema.safeParse(formData);

    if (!validatedForm.success) {
      const error = validatedForm.error.format();
      return json({
        type: "input-error",
        issues: error,
      });
    }

    const sellLog = await sellLogModel.mutation.softDelete({
      id: validatedParams.data.id,
    });

    await buyLogModel.mutation.syncBalanceQty({
      id: sellLog.buy_log_id,
    });

    return json({
      type: "success",
    });
  }

  throw new Error("Invalid Action");
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await authUser({
    request,
  });

  const validatedParams = z
    .object({
      id: z.coerce.number().finite().nonnegative(),
    })
    .safeParse(params);

  if (!validatedParams.success) {
    throw new Error("Invalid Params");
  }

  const validatedSearchParams = validateSearchParams(
    request,
    z.object({
      mode: z.enum(["delete", "update"]),
    })
  );

  if (!validatedSearchParams.success) {
    throw new Error("Invalid Search Params");
  }

  const sellLog = await sellLogModel.data.findOne({
    id: validatedParams.data.id,
    created_by: user.id,
  });

  if (!sellLog) {
    throw redirect("/sell_logs");
  }

  const buyLog = await buyLogModel.data.findOne({
    id: sellLog.buy_log_id,
    created_by: user.id,
  });

  if (!buyLog) {
    throw new Error("Restricted Access2");
  }

  const buyItemTypes = [
    {
      label: "USDT",
      value: "USDT",
    },
  ] as ComboboxData;

  return json({
    buyItemTypes,
    buyLog,
    sellLog,
    _action: validatedSearchParams.data.mode,
  });
}

export default function BillsIdPage() {
  const navigate = useNavigate();
  const { buyLog, buyItemTypes, sellLog, _action } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { getIssue, clearIssue, setIssues } = useValidationHook<InputErrors>();

  const [form, setForm] = useState<{
    sell_qty: string | number;
    sell_rate: string | number;
    sell_at: DateValue;
    remarks: string;
  }>({
    sell_qty: sellLog.sell_qty,
    sell_rate: sellLog.sell_rate,
    sell_at: sellLog?.sell_at ? new Date(sellLog.sell_at) : new Date(),
    remarks: sellLog.remarks ?? "",
  });

  const [isOpen, { open, close }] = useDisclosure(false, {
    onClose() {
      setTimeout(() => navigate("/sell_logs"), 100);
    },
  });
  const gridColProps = { lg: 12 };

  useEffect(() => {
    open();
  }, []);

  useEffect(() => {
    if (actionData?.type === "input-error") {
      //@ts-ignore
      setIssues(actionData.issues);
    }
    if (actionData?.type === "success") {
      setIssues(undefined);
      setForm((x) => ({ ...x, sell_qty: "", sell_rate: "" }));
      close();
    }
  }, [actionData]);

  const labelMap = {
    update: {
      title: `Update Buy Record #${sellLog?.id}`,
      buttonColor: "orange",
      buttonLabel: "Update",
    },
    delete: {
      title: `Delete Buy Record #${sellLog?.id}`,
      buttonColor: "red",
      buttonLabel: "Delete",
    },
  } as const;

  const isReadOnly = _action === "delete" ? true : false;

  return (
    <Drawer
      title={
        <Title component="span" order={4}>
          {labelMap[_action].title}
        </Title>
      }
      size="lg"
      position="right"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      opened={isOpen}
      onClose={close}
    >
      <Card>
        <Grid>
          <Grid.Col span={12}>
            <Title component="span" order={4} className="text-center">
              Buy Log #{buyLog?.id}
            </Title>
          </Grid.Col>
          <Grid.Col span={12}>
            <Select
              data={buyItemTypes}
              withAsterisk
              value={buyLog?.buy_item}
              name="buy_item"
              label="Buy Item"
              disabled={true}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              withAsterisk
              value={buyLog.buy_qty}
              name="buy_qty"
              label="Buy Quantity"
              disabled={true}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              withAsterisk
              value={buyLog?.buy_rate}
              name="buy_rate"
              label="Buy Rate"
              disabled={true}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateInput
              value={buyLog?.buy_at ? new Date(buyLog.buy_at) : undefined}
              name="buy_at"
              label="Bought At"
              disabled={true}
              placeholder="Will default to now"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              withAsterisk
              value={buyLog?.balance_qty}
              label="Balance Qty"
              disabled={true}
            />
          </Grid.Col>
          <Grid.Col span={gridColProps}>
            <Textarea
              placeholder="Notes"
              autosize
              minRows={2}
              withAsterisk
              value={buyLog?.remarks ?? ""}
              name="remarks"
              label="Remarks"
              disabled={true}
            />
          </Grid.Col>
        </Grid>
      </Card>
      <Box m={4} mt={6}>
        <Form method="POST">
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                readOnly={isReadOnly}
                withAsterisk
                value={form.sell_qty}
                name="sell_qty"
                label="Sell Quantity"
                error={getIssue("sell_qty")}
                onChange={(val) => {
                  clearIssue("sell_qty");
                  setForm((x) => ({ ...x, sell_qty: val }));
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                readOnly={isReadOnly}
                withAsterisk
                value={form.sell_rate}
                name="sell_rate"
                label="Sell Rate"
                error={getIssue("sell_rate")}
                onChange={(val) => {
                  clearIssue("sell_rate");
                  setForm((x) => ({ ...x, sell_rate: val }));
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DateInput
                readOnly={isReadOnly}
                value={form.sell_at}
                name="sell_at"
                label="Sold At"
                error={getIssue("sell_at")}
                onChange={(val) => {
                  clearIssue("sell_at");
                  setForm((x) => ({ ...x, sell_at: val }));
                }}
                placeholder="Will default to now"
              />
            </Grid.Col>

            <Grid.Col span={gridColProps}>
              <Textarea
                readOnly={isReadOnly}
                placeholder="Notes"
                autosize
                minRows={4}
                withAsterisk
                value={form.remarks}
                name="remarks"
                label="Remarks"
                error={getIssue("remarks")}
                onChange={(event) => {
                  clearIssue("remarks");
                  setForm((x) => ({
                    ...x,
                    remarks: event.currentTarget.value ?? "",
                  }));
                }}
              />
            </Grid.Col>
            <Grid.Col span={gridColProps}>
              <Input name="_action" type="hidden" value={_action} />
              <Button
                type="submit"
                fullWidth
                color={labelMap[_action].buttonColor}
              >
                {labelMap[_action].buttonLabel}
              </Button>
            </Grid.Col>
          </Grid>
        </Form>
      </Box>
    </Drawer>
  );
}
