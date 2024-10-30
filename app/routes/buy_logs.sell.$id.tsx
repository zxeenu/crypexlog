import {
  Badge,
  Box,
  Button,
  Card,
  ComboboxData,
  Divider,
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
import { Fragment, useEffect, useState } from "react";
import { z } from "zod";
import { useValidationHook } from "~/hooks/validationHook";
import { authUser } from "~/lib/auth.server";
import { buyLogModel } from "~/lib/models/buyLog.server";
import { sellLogModel } from "~/lib/models/sellLog.server";

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
      sellEntry?: {
        id: number;
      };
    };

export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<ActionResponse>> {
  throw redirect("/");

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

  const buyLog = await buyLogModel.data.findOne({
    id: validatedParams.data.id,
    created_by: user.id,
  });

  if (!buyLog) {
    throw new Error("Restricted Access");
  }

  const form = await request.formData();
  const { _action, ...formData } = Object.fromEntries(form);

  if (_action === "sell_entry") {
    const validatedForm = createSchema.safeParse(formData);

    if (!validatedForm.success) {
      const error = validatedForm.error.format();
      return json({
        type: "input-error",
        issues: error,
      });
    }

    const sellLog = await sellLogModel.mutation.create({
      data: {
        sell_qty: validatedForm.data.sell_qty,
        sell_rate: validatedForm.data.sell_rate,
        createdBy: {
          connect: {
            id: user.id,
          },
        },
        sell_at: validatedForm.data.sell_at,
        remarks: validatedForm.data.remarks,
        buyLog: {
          connect: {
            id: validatedParams.data.id,
          },
        },
      },
    });

    await buyLogModel.mutation.syncBalanceQty({
      id: validatedParams.data.id,
    });

    return json({
      type: "success",
      sellEntry: sellLog,
    });
  }

  throw new Error("Invalid Action");
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  throw redirect("/");

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

  const buyLog = await buyLogModel.data.findOne({
    id: validatedParams.data.id,
    created_by: user.id,
  });

  if (!buyLog) {
    throw new Error("Restricted Access");
  }

  const buyItemTypes = [
    {
      label: "USDT",
      value: "USDT",
    },
  ] as ComboboxData;

  return json({
    buyItemTypes,
    data: buyLog,
  });
}

export default function BillsIdPage() {
  const navigate = useNavigate();
  const { data, buyItemTypes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { getIssue, clearIssue, setIssues } = useValidationHook<InputErrors>();

  const [form, setForm] = useState<{
    sell_qty: string | number;
    sell_rate: string | number;
    sell_at: DateValue;
    remarks: string;
  }>({
    sell_qty: "",
    sell_rate: "",
    sell_at: new Date(),
    remarks: "",
  });

  const [createdList, setCreatedList] = useState<number[]>([]);

  const [isOpen, { open, close }] = useDisclosure(false, {
    onClose() {
      setTimeout(() => navigate("/buy_logs"), 100);
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

      if (actionData.sellEntry && actionData.sellEntry?.id) {
        const newEntry = actionData.sellEntry.id;
        setCreatedList((x) => [...x, newEntry]);
      }
    }
  }, [actionData]);

  const disabled = true;

  return (
    <Drawer
      title={
        <Title component="span" order={4}>
          Sell Entry
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
              Buy Log #{data?.id}
            </Title>
          </Grid.Col>
          <Grid.Col span={12}>
            <Select
              data={buyItemTypes}
              withAsterisk
              value={data?.buy_item}
              name="buy_item"
              label="Buy Item"
              disabled={disabled}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              withAsterisk
              value={data.buy_qty}
              name="buy_qty"
              label="Buy Quantity"
              disabled={disabled}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              withAsterisk
              value={data?.buy_rate}
              name="buy_rate"
              label="Buy Rate"
              disabled={disabled}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateInput
              value={data?.buy_at ? new Date(data.buy_at) : undefined}
              name="buy_at"
              label="Bought At"
              disabled={disabled}
              placeholder="Will default to now"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              withAsterisk
              value={data?.balance_qty}
              label="Balance Qty"
              disabled={disabled}
            />
          </Grid.Col>
          <Grid.Col span={gridColProps}>
            <Textarea
              placeholder="Notes"
              autosize
              minRows={2}
              withAsterisk
              value={data?.remarks ?? ""}
              name="remarks"
              label="Remarks"
              disabled={disabled}
            />
          </Grid.Col>
        </Grid>
      </Card>
      <Box m={4} mt={6}>
        <Form method="POST">
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
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
              <Input name="_action" type="hidden" value={"sell_entry"} />
              <Button type="submit" fullWidth>
                Save
              </Button>
            </Grid.Col>
          </Grid>
        </Form>

        {createdList.length > 0 && (
          <Fragment>
            <Divider my="md" variant="dashed" />
            <Title order={4} className="text-center">
              New Sell Records
            </Title>
            {createdList.map((id) => {
              return (
                <Badge key={id} m={5}>
                  Sell Log #{id}
                </Badge>
              );
            })}
          </Fragment>
        )}
      </Box>
    </Drawer>
  );
}
