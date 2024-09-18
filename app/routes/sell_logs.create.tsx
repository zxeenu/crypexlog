import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  ComboboxData,
  Divider,
  Drawer,
  Grid,
  Group,
  NumberFormatter,
  NumberInput,
  ScrollArea,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { DateInput, DateValue } from "@mantine/dates";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  TypedResponse,
} from "@remix-run/node";
import {
  json,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSubmit,
} from "@remix-run/react";
import { Fragment, useEffect, useState } from "react";
import { z } from "zod";
import { useValidationHook } from "~/hooks/validationHook";
import { authUser } from "~/lib/auth.server";
import { DEBOUNCE_MS_DEFAULT } from "~/lib/constants";
import { buyRefCode, formatDate } from "~/lib/utils";
import { loader as sellLogSearchLoader } from "~/routes/api.sell_log_search";
import classes from "~/styles/checkboxCard.module.css";

const createSchema = z.object({
  sell_qty: z.coerce.number().gt(0),
  sell_rate: z.coerce.number(),
  sell_at: z.coerce.date(),
  remarks: z.string(),
  buy_log_ids: z.coerce.number().array(),
});

type ActionJson = Partial<
  z.output<typeof createSchema> & {
    _action: string;
  }
>;

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
}: ActionFunctionArgs): Promise<TypedResponse<ActionResponse>> {
  const user = await authUser({
    request,
  });

  const form = (await request.json()) as ActionJson;

  const { _action, ...formData } = form;
  const validatedForm = createSchema.safeParse(formData);

  if (!validatedForm.success) {
    const error = validatedForm.error.format();
    return json({
      type: "input-error",
      issues: error,
    });
  }

  return json({
    type: "success",
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  await authUser({
    request,
  });

  const buyItemTypes = [
    {
      label: "USDT",
      value: "USDT",
    },
  ] as ComboboxData;

  return json({
    buyItemTypes,
  });
}

type FetcherReturnType = ReturnType<
  typeof useFetcher<typeof sellLogSearchLoader>
>;

type FetcherSuccess = Extract<FetcherReturnType["data"], { status: "success" }>;
type CashedBuyLogs = FetcherSuccess["data"];

export default function BillsIdPage() {
  const navigate = useNavigate();
  const { buyItemTypes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { getIssue, clearIssue, setIssues } = useValidationHook<InputErrors>();
  const submit = useSubmit();

  const searchFetcher = useFetcher<typeof sellLogSearchLoader>();
  const [cashedBuyLog, setCachedBuyLogs] = useState<CashedBuyLogs>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, DEBOUNCE_MS_DEFAULT);

  const [includeSoldOut, setIncludeSoldOut] = useState(false);
  const [debouncedIncludeSoldOut] = useDebouncedValue(
    includeSoldOut,
    DEBOUNCE_MS_DEFAULT
  );

  const [form, setForm] = useState<{
    sell_qty: string | number;
    sell_rate: string | number;
    sell_at: DateValue;
    remarks: string;
    buy_log_ids: number[];
  }>({
    sell_qty: "",
    sell_rate: "",
    sell_at: new Date(),
    remarks: "",
    buy_log_ids: [],
  });

  const submitBatchSell = () => {
    // @ts-ignore
    submit(form, {
      method: "POST",
      encType: "application/json",
    });
  };

  const calculateRequirements = () => {
    const selectedBuyLogs = form.buy_log_ids.map((selectedBuyLogId) => {
      const buyLog = cashedBuyLog.find((log) => log.id === selectedBuyLogId);

      if (!buyLog) {
        return 0;
      }
      return buyLog.buy_qty;
    });

    const sumOfSelected = selectedBuyLogs.reduce((acc, curr) => acc + curr, 0);

    const sellQtyParseResult = z.coerce.number().safeParse(form.sell_qty);
    if (!sellQtyParseResult.success) {
      throw new Error("Sell qty could not be parsed");
    }

    let sellQtyAsNumber = sellQtyParseResult.data;

    const balance = sumOfSelected - sellQtyAsNumber;
    const status: "Enough" | "Not Enough" =
      balance < 0 ? "Not Enough" : "Enough";

    const isSubmittable =
      status === "Enough" && sumOfSelected > 0 && sellQtyAsNumber > 0;

    return {
      balance: balance,
      status,
      sum: sumOfSelected,
      balanceForView: balance * -1,
      isSubmittable,
    };
  };

  const calculatedRequirements = calculateRequirements();

  const [isOpen, { open, close }] = useDisclosure(false, {
    onClose() {
      setTimeout(() => navigate("/sell_logs"), 100);
    },
  });

  useEffect(() => {
    open();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams();
    searchParams.set("search", debouncedSearch);
    searchParams.set("include_sold_out", String(debouncedIncludeSoldOut));
    searchFetcher.load(`/api/sell_log_search?${searchParams.toString()}`);
  }, [debouncedSearch, debouncedIncludeSoldOut]);

  // This messy business is to keep the checked buy logs visible,
  // even when new data is searched
  useEffect(() => {
    if (searchFetcher.data?.status !== "success") {
      return;
    }

    const preparedBuyLogs: CashedBuyLogs = [];
    const copyOfCashedBuyLogs = structuredClone(cashedBuyLog);

    for (const currentBuyId of form.buy_log_ids) {
      const buyLog = copyOfCashedBuyLogs.find((x) => x.id === currentBuyId);

      if (buyLog) {
        preparedBuyLogs.push(buyLog);
      }
    }

    const newBuyLogData = searchFetcher.data.data;
    for (const newBuyLog of newBuyLogData) {
      const buyLog = preparedBuyLogs.find((x) => x.id === newBuyLog.id);
      if (!buyLog) {
        preparedBuyLogs.push(newBuyLog);
      }
    }

    setCachedBuyLogs(() => preparedBuyLogs);
  }, [searchFetcher]);

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

  return (
    <Drawer
      title={
        <Title component="span" order={4}>
          Add Sell Logs
        </Title>
      }
      size="lg"
      position="right"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      opened={isOpen}
      onClose={close}
    >
      <Grid>
        <Grid.Col span={12}>
          <TextInput
            value={search}
            placeholder="Search remarks or buy rate"
            label="Search"
            onChange={(event) => {
              setSearch(event.currentTarget.value ?? "");
            }}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Checkbox
            checked={includeSoldOut}
            label="Include sold out"
            onChange={(event) => {
              setIncludeSoldOut(event.currentTarget.checked);
            }}
          />
        </Grid.Col>
      </Grid>
      <Divider my="md" variant="dashed" />

      <Box m={4} mt={6}>
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

          <Grid.Col span={12}>
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
        </Grid>
      </Box>

      <Box m={4} mt={10} mb={6}>
        <Alert
          variant="light"
          color={calculatedRequirements.status === "Enough" ? "green" : "red"}
          title={calculatedRequirements.status}
        >
          <Grid className="w-full">
            <Grid.Col span={6}>
              <Text>Balance</Text>
              <NumberFormatter
                value={calculatedRequirements.balanceForView}
                thousandSeparator
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Text>Sum Of Selected Buy Logs</Text>
              <NumberFormatter
                value={calculatedRequirements.sum}
                thousandSeparator
              />
            </Grid.Col>
          </Grid>
        </Alert>
      </Box>

      {cashedBuyLog.length > 0 && (
        <Box m={4} mt={6}>
          <ScrollArea mah={500}>
            {cashedBuyLog.map((buyLog) => {
              return (
                <Fragment key={buyLog.id}>
                  <Checkbox.Card
                    my={5}
                    className={classes.root}
                    radius="md"
                    checked={form.buy_log_ids.includes(buyLog.id)}
                    onClick={(event) => {
                      setForm((form) => {
                        const isSelected = form.buy_log_ids.find(
                          (id) => id === buyLog.id
                        );

                        const newBuyIdLit = form.buy_log_ids.filter(
                          (id) => id !== buyLog.id
                        );

                        if (!isSelected) {
                          newBuyIdLit.push(buyLog.id);
                        }

                        const _newForm = {
                          ...form,
                          buy_log_ids: newBuyIdLit,
                        };

                        return _newForm;
                      });
                    }}
                  >
                    <Group wrap="nowrap" align="flex-start">
                      <Checkbox.Indicator />
                      <div>
                        <Group align="flex-end">
                          <Badge className={classes.label} color="indigo">
                            {buyRefCode(buyLog.id)}
                          </Badge>
                          {buyLog.balance_qty <= 0 && (
                            <Badge className={classes.label} color="red">
                              Sold Out
                            </Badge>
                          )}
                          <Text className={classes.label}>
                            Bal Qty: {buyLog.balance_qty}
                          </Text>
                        </Group>
                        <Group align="flex-end">
                          <Text className={classes.description}>
                            Buy Rate: {buyLog.buy_rate}
                          </Text>
                          <Text className={classes.description}>
                            @{buyLog.buy_at ? formatDate(buyLog.buy_at) : "N/A"}
                          </Text>
                        </Group>

                        <Group align="flex-end">
                          <Text className={classes.description}>
                            Item Name: {buyLog.buy_item}
                          </Text>
                          <Text className={classes.description}>
                            {buyLog.remarks}
                          </Text>
                        </Group>
                      </div>
                    </Group>
                  </Checkbox.Card>
                </Fragment>
              );
            })}
          </ScrollArea>
        </Box>
      )}

      <Box m={4} mt={6}>
        <Grid>
          <Grid.Col span={12}>
            <Button
              fullWidth
              disabled={!calculatedRequirements.isSubmittable}
              onClick={submitBatchSell}
            >
              Save
            </Button>
          </Grid.Col>
        </Grid>
      </Box>
    </Drawer>
  );
}
