import {
  ActionIcon,
  Affix,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Menu,
  NumberFormatter,
  Pagination,
  Paper,
  Table,
  TextInput,
  Title,
  Transition,
  rem,
} from "@mantine/core";
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  IconCirclePlus,
  IconDots,
  IconDotsVertical,
  IconPencil,
  IconReceiptBitcoin,
  IconTrash,
  IconZoom,
} from "@tabler/icons-react";
import { Fragment } from "react/jsx-runtime";
import { z } from "zod";
import Empty from "~/components/Empty/Empty";
import { authUser } from "~/lib/auth.server";
import { buyLogModel } from "~/lib/models/buyLog.server";
import { MenuAction, buyRefCode, dbPaginator, formatDate } from "~/lib/utils";
import { validateSearchParams } from "~/lib/validation";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authUser({
    request,
  });

  const validatedSearchParams = await validateSearchParams(
    request,
    z.object({
      page: z.coerce.number().int().gt(0).default(1),
      "filters[buy_log_id]": z.coerce.number().optional(),
    })
  );

  if (!validatedSearchParams.success) {
    throw redirect("/buy_logs");
  }

  const pagination = dbPaginator(validatedSearchParams.data);

  const { data, total } = await buyLogModel.data.pages({
    pagination: pagination,
    created_by: user.id,
    filters: {
      buy_log_id: validatedSearchParams.data["filters[buy_log_id]"],
    },
  });

  return json({
    data,
    total,
    currentPage: validatedSearchParams.data.page,
  });
}

export default function BuyLogs() {
  const { data, total, currentPage } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const actions: MenuAction<
    ReturnType<typeof useLoaderData<typeof loader>>["data"][number]
  >[] = [
    {
      type: "link",
      color: "green",
      condition: (item) => {
        if (item.deleted_at) {
          return false;
        }
        return true;
      },
      link: (item) => {
        return `/buy_logs/sell/${item.id}`;
      },
      slug: "sell",
      label: "Sell",
      icon: <IconReceiptBitcoin style={{ width: rem(14), height: rem(14) }} />,
    },
    {
      type: "link",
      condition: (item) => {
        if (item.deleted_at) {
          return false;
        }
        return true;
      },
      link: (item) => {
        return `/buy_logs/${item.id}?mode=update`;
      },
      slug: "update",
      label: "Update",
      icon: <IconPencil style={{ width: rem(14), height: rem(14) }} />,
    },
    {
      type: "link",
      color: "red",
      condition: (item) => {
        if (item.deleted_at) {
          return false;
        }
        return true;
      },
      link: (item) => {
        return `/buy_logs/${item.id}?mode=delete`;
      },
      slug: "delete",
      label: "Delete",
      icon: <IconTrash style={{ width: rem(14), height: rem(14) }} />,
    },
  ];

  return (
    <Paper p="lg">
      <Group justify="space-between">
        <Title order={4}>Buy Logs</Title>
        <Box ml={-25} className="hidden">
          <TextInput
            placeholder="Search"
            radius={20}
            rightSection={<IconZoom />}
          />
        </Box>
        <Link to="/buy_logs/new?mode=create">
          <ActionIcon variant="transparent" className="hide-on-mobile">
            <IconCirclePlus />
          </ActionIcon>
        </Link>
      </Group>
      <Divider my="md" variant="dashed" />
      {data.length === 0 ? (
        <Fragment>
          <Empty label="You havent added any buy logs" />
        </Fragment>
      ) : (
        <Fragment>
          <Table striped highlightOnHover withRowBorders={false} stickyHeader>
            <Table.Thead>
              <Table.Tr className="hide-on-mobile">
                <Table.Th>Buy ID</Table.Th>
                <Table.Th>Item Name</Table.Th>
                <Table.Th>Buy Rate</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th>Balance Qty</Table.Th>
                <Table.Th>Remarks</Table.Th>
                <Table.Th>Bought At</Table.Th>
                <Table.Th>Created At</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((item) => {
                const MenuComponent = () => {
                  const allowedActions = actions.filter((a) =>
                    a.condition(item)
                  );

                  if (allowedActions.length === 0) {
                    return <Fragment />;
                  }

                  return (
                    <Menu openDelay={100} closeDelay={400}>
                      <Menu.Target>
                        <ActionIcon variant="transparent">
                          <IconDotsVertical
                            size={20}
                            className="show-on-mobile"
                          />
                          <IconDots size={14} className="hide-on-mobile" />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>Actions</Menu.Label>
                        {allowedActions.map((action) => {
                          if (action.type === "link") {
                            const link = action.link(item);
                            return (
                              <Link to={link} key={action.slug}>
                                <Menu.Item
                                  color={action.color}
                                  leftSection={action.icon}
                                >
                                  {action.label}
                                </Menu.Item>
                              </Link>
                            );
                          }

                          if (action.type === "button") {
                            return (
                              <Menu.Item
                                color={action.color}
                                key={action.slug}
                                onClick={() => action.action(item)}
                                leftSection={action.icon}
                              >
                                {action.label}
                              </Menu.Item>
                            );
                          }
                        })}
                      </Menu.Dropdown>
                    </Menu>
                  );
                };

                let balBadgeColor: "green" | "red" | "blue" | "orange" =
                  "orange";

                if (item.balance_qty < 0) {
                  balBadgeColor = "red";
                }

                if (item.balance_qty === 0) {
                  balBadgeColor = "green";
                }

                if (item.balance_qty > 0) {
                  balBadgeColor = "blue";
                }

                return (
                  <Fragment key={item.id}>
                    <Table.Tr key={item.id} className="section-border-mobile">
                      <Table.Td data-label="" className="show-on-mobile">
                        <MenuComponent />
                      </Table.Td>
                      <Table.Td data-label="Buy ID">
                        <Badge color="indigo">{buyRefCode(item.id)}</Badge>
                      </Table.Td>
                      <Table.Td data-label="Item Name">
                        <Badge>{item.buy_item}</Badge>
                      </Table.Td>
                      <Table.Td data-label="Buy Rate">
                        <NumberFormatter
                          value={item.buy_rate}
                          thousandSeparator
                        />
                      </Table.Td>
                      <Table.Td data-label="Qty">
                        <NumberFormatter
                          value={item.buy_qty}
                          thousandSeparator
                        />
                      </Table.Td>
                      <Table.Td data-label="Balance Qty">
                        <Badge color={balBadgeColor}>
                          {balBadgeColor === "green" ? (
                            "Sold Out"
                          ) : (
                            <NumberFormatter
                              value={item.balance_qty}
                              thousandSeparator
                            />
                          )}
                        </Badge>
                      </Table.Td>
                      <Table.Td data-label="Remarks">
                        {item?.remarks ? item.remarks : "N/A"}
                      </Table.Td>
                      <Table.Td data-label="Bought At">
                        {formatDate(item.buy_at)}
                      </Table.Td>
                      <Table.Td data-label="Created At">
                        {formatDate(item.created_at)}
                      </Table.Td>
                      <Table.Td className="text-right md:text-right hide-on-mobile">
                        <MenuComponent />
                      </Table.Td>
                    </Table.Tr>
                  </Fragment>
                );
              })}
            </Table.Tbody>
          </Table>
          <Center my={25}>
            <Pagination
              total={total}
              value={currentPage}
              onChange={(pageNumber) => {
                setSearchParams((params) => {
                  params.set("page", String(pageNumber));
                  return params;
                });
              }}
            />
          </Center>
        </Fragment>
      )}
      <Outlet />
      <Affix
        zIndex={199}
        position={{ bottom: 20, right: 20 }}
        className="show-on-mobile"
      >
        <Transition transition="slide-up" mounted={true}>
          {(transitionStyles) => (
            <Link to="/buy_logs/new?mode=create">
              <Button
                leftSection={
                  <IconCirclePlus style={{ width: rem(16), height: rem(16) }} />
                }
                style={transitionStyles}
              >
                Add Buy Log
              </Button>
            </Link>
          )}
        </Transition>
      </Affix>
    </Paper>
  );
}
