import {
  Button,
  ComboboxData,
  Drawer,
  Grid,
  Input,
  NumberInput,
  SegmentedControl,
  Select,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  TypedResponse,
} from "@remix-run/node";
import {
  Form,
  json,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { useEffect } from "react";
import { z } from "zod";
import { useValidationHook } from "~/hooks/validationHook";
import { authUser } from "~/lib/auth.server";
import { buyLogModel } from "~/lib/models/buyLog.server";
import { validateSearchParams } from "~/lib/validation";

const createSchema = z.object({
  buy_item: z.string().min(2),
  buy_qty: z.coerce.number().gt(0),
  buy_rate: z.coerce.number(),
  buy_at: z.coerce.date(),
  remarks: z.string(),
});

const updateSchema = z.object({
  buy_item: z.string().min(2),
  buy_qty: z.coerce.number().gt(0),
  buy_rate: z.coerce.number(),
  buy_at: z.coerce.date(),
  remarks: z.string(),
});

type InputErrors = z.inferFormattedError<typeof createSchema> &
  z.inferFormattedError<typeof updateSchema>;

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
      id: z.union([z.literal("new"), z.coerce.number().finite().nonnegative()]),
    })
    .safeParse(params);

  if (!validatedParams.success) {
    throw new Error("Invalid Params");
  }

  const form = await request.formData();
  const { _action, ...formData } = Object.fromEntries(form);

  if (_action === "create") {
    const validatedForm = createSchema.safeParse(formData);

    if (!validatedForm.success) {
      const error = validatedForm.error.format();
      return json({
        type: "input-error",
        issues: error,
      });
    }

    await buyLogModel.mutation.create({
      data: {
        buy_qty: validatedForm.data.buy_qty,
        buy_rate: validatedForm.data.buy_rate,
        createdBy: {
          connect: {
            id: user.id,
          },
        },
        buy_at: validatedForm.data.buy_at,
        remarks: validatedForm.data.remarks,
        buy_item: validatedForm.data.buy_item,
        balance_qty: validatedForm.data.buy_qty,
      },
    });

    return json({
      type: "success",
    });
  }

  if (_action === "update") {
    const validatedForm = updateSchema.safeParse(formData);

    if (validatedParams.data.id === "new") {
      throw new Error("Invalid Params");
    }

    if (!validatedForm.success) {
      const error = validatedForm.error.format();
      return json({
        type: "input-error",
        issues: error,
      });
    }

    await buyLogModel.mutation.update({
      id: validatedParams.data.id,
      data: {
        buy_qty: validatedForm.data.buy_qty,
        buy_rate: validatedForm.data.buy_rate,
        buy_at: validatedForm.data.buy_at,
        remarks: validatedForm.data.remarks,
        buy_item: validatedForm.data.buy_item,
        balance_qty: validatedForm.data.buy_qty,
      },
    });

    // TODO: recalculate the new balance

    return json({
      type: "success",
    });
  }

  if (_action === "delete") {
    if (validatedParams.data.id === "new") {
      throw new Error("Invalid Params");
    }

    await buyLogModel.mutation.softDelete({
      id: validatedParams.data.id,
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
      id: z.union([z.literal("new"), z.coerce.number().finite().nonnegative()]),
    })
    .safeParse(params);

  if (!validatedParams.success) {
    throw new Error("Invalid Params");
  }

  const validatedSearchParams = validateSearchParams(
    request,
    z.object({
      mode: z.enum(["delete", "update", "create"]),
    })
  );

  if (!validatedSearchParams.success) {
    throw new Error("Invalid Search Params");
  }

  const buyLog =
    validatedParams.data.id === "new"
      ? null
      : await buyLogModel.data.findOne({
          id: validatedParams.data.id,
          created_by: user.id,
        });

  if (validatedParams.data.id === "new" && buyLog) {
    throw new Error("Data fetched on edit mode");
  }

  const buyItemTypes = [
    {
      label: "USDT",
      value: "USDT",
    },
  ] as ComboboxData;

  return json({
    _action: validatedSearchParams.data.mode,
    buyItemTypes,
    data: buyLog,
  });
}

export default function BillsIdPage() {
  const navigate = useNavigate();
  const { _action, data, buyItemTypes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { getIssue, clearIssue, setIssues } = useValidationHook<InputErrors>();

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
      close();
    }
  }, [actionData]);

  const labelMap = {
    create: {
      title: "Create Buy Record",
      buttonColor: "orange",
      buttonLabel: "Save",
    },
    update: {
      title: `Update Buy Record #${data?.id}`,
      buttonColor: "orange",
      buttonLabel: "Update",
    },
    delete: {
      title: `Delete Buy Record #${data?.id}`,
      buttonColor: "red",
      buttonLabel: "Delete",
    },
  };

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
      <Form method="POST">
        <Grid>
          <Grid.Col span={12}>
            <Select
              data={buyItemTypes}
              withAsterisk
              defaultValue={data?.buy_item ?? "USDT"}
              name="buy_item"
              label="Buy Item"
              error={getIssue("buy_item")}
              onChange={() => clearIssue("buy_item")}
              readOnly={isReadOnly}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              withAsterisk
              defaultValue={data?.buy_qty ?? undefined}
              name="buy_qty"
              label="Quantity"
              error={getIssue("buy_qty")}
              onChange={() => clearIssue("buy_qty")}
              readOnly={isReadOnly}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              withAsterisk
              defaultValue={data?.buy_rate ?? undefined}
              name="buy_rate"
              label="Buy Rate"
              error={getIssue("buy_rate")}
              onChange={() => clearIssue("buy_rate")}
              readOnly={isReadOnly}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateInput
              defaultValue={data?.buy_at ? new Date(data.buy_at) : new Date()}
              name="buy_at"
              label="Bought At"
              error={getIssue("buy_at")}
              onChange={() => clearIssue("buy_at")}
              readOnly={isReadOnly}
              placeholder="Will default to now"
            />
          </Grid.Col>
          <Grid.Col span={gridColProps}>
            <Textarea
              placeholder="Notes"
              autosize
              minRows={4}
              withAsterisk
              defaultValue={data?.remarks ?? undefined}
              name="remarks"
              label="Remarks"
              error={getIssue("remarks")}
              onChange={() => clearIssue("remarks")}
              readOnly={isReadOnly}
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
    </Drawer>
  );
}
