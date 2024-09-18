import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Divider,
  Group,
  Menu,
  Pagination,
  Paper,
  Table,
  TextInput,
  Title,
  rem,
} from "@mantine/core";
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  IconDots,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconZoom,
} from "@tabler/icons-react";
import { Fragment } from "react/jsx-runtime";
import { z } from "zod";
import Empty from "~/components/Empty/Empty";
import { authUser } from "~/lib/auth.server";
import { sellLogModel } from "~/lib/models/sellLog.server";
import { MenuAction, dbPaginator, formatDate } from "~/lib/utils";
import { validateSearchParams } from "~/lib/validation";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authUser({
    request,
  });

  const validatedSearchParams = await validateSearchParams(
    request,
    z.object({
      page: z.coerce.number().int().gt(0).default(1),
    })
  );

  if (!validatedSearchParams.success) {
    throw redirect("/sell_logs");
  }

  const pagination = dbPaginator(validatedSearchParams.data);

  const { data, total } = await sellLogModel.data.pages({
    pagination: pagination,
    created_by: user.id,
  });

  return json({
    data,
    total,
    currentPage: validatedSearchParams.data.page,
  });
}

export default function SellLogs() {
  const { data, total, currentPage } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const actions: MenuAction<
    ReturnType<typeof useLoaderData<typeof loader>>["data"][number]
  >[] = [
    {
      type: "link",
      condition: (item) => {
        return false;

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
        return false;

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
        <Title order={4}>Sell Logs</Title>
        <Box ml={-25} className="hidden">
          <TextInput
            placeholder="Search"
            radius={20}
            rightSection={<IconZoom />}
          />
        </Box>
      </Group>
      <Divider my="md" variant="dashed" />
      {data.length === 0 ? (
        <Fragment>
          <Empty label="You havent sold anything yet" />
        </Fragment>
      ) : (
        <Fragment>
          <Table striped highlightOnHover withRowBorders={false} stickyHeader>
            <Table.Thead>
              <Table.Tr className="hide-on-mobile">
                <Table.Th>Sell ID</Table.Th>
                <Table.Th>Item Details</Table.Th>
                <Table.Th>Sell Rate</Table.Th>
                <Table.Th>Sell Qty</Table.Th>
                <Table.Th>Remarks</Table.Th>
                <Table.Th>Sold At</Table.Th>
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
                            size={14}
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

                return (
                  <Fragment key={item.id}>
                    <Table.Tr key={item.id} className="section-border-mobile">
                      <Table.Td data-label="" className="show-on-mobile">
                        <MenuComponent />
                      </Table.Td>
                      <Table.Td data-label="Sell ID">{item.id}</Table.Td>
                      <Table.Td data-label="Item Details">
                        <Badge mx={4}>Buy Log: #{item.buyLog.id}</Badge>
                        <Badge>{item.buyLog.buy_item}</Badge>
                      </Table.Td>
                      <Table.Td data-label="Sell Rate">
                        {item.sell_rate}
                      </Table.Td>
                      <Table.Td data-label="Sell Qty">{item.sell_qty}</Table.Td>
                      <Table.Td data-label="Remarks">{item.remarks}</Table.Td>
                      <Table.Td data-label="Sold At">
                        {formatDate(item.sell_at)}
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
    </Paper>
  );
}