import {
  AppShell,
  Box,
  Burger,
  Button,
  Divider,
  Group,
  Skeleton,
  Text,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { Link, useFetcher } from "@remix-run/react";
import {
  IconDeviceAnalytics,
  IconKey,
  IconLego,
  IconLogin,
  IconLogout,
  IconProps,
  IconReceipt,
  IconUsers,
} from "@tabler/icons-react";
import { Fragment, PropsWithChildren, useContext } from "react";
import { NavBarContext } from "~/context/navBarContext";
import { RootData, useRootData } from "~/hooks/rootData";
import classes from "./DefaultLayout.module.css";

type Prop = PropsWithChildren<{}>;

function NavBarIconGenerator({
  iconItem,
}: {
  iconItem:
    | NonNullable<RootData>["navLinks"][number]
    | NonNullable<RootData>["navActions"][number];
}) {
  const props: Omit<IconProps, "children"> = iconItem?.iconProps
    ? {
        ...iconItem?.iconProps,
        className: classes.linkIcon,
      }
    : {
        stroke: 1.5,
        className: classes.linkIcon,
      };

  switch (iconItem.icon) {
    case "lego":
      return <IconLego {...props} />;
    case "reciept":
      return <IconReceipt {...props} />;
    case "logout":
      return <IconLogout {...props} />;
    case "login":
      return <IconLogin {...props} />;
    case "key":
      return <IconKey {...props} />;
    case "users":
      return <IconUsers {...props} />;
    default:
      return null;
  }
}

export function DefaultLayout({ children }: Prop) {
  const navBarContext = useContext(NavBarContext);
  if (!navBarContext) {
    throw new Error("Navbar context not found");
  }

  const fetcher = useFetcher();
  const matches = useMediaQuery("(max-width: 600px)");
  const rootData = useRootData();
  const [opened, { toggle, close }] = useDisclosure();

  const links = rootData?.navLinks.map((item) => {
    return (
      <Link
        to={
          rootData.loggedIn
            ? item.link
            : `/login?redirectTo=${encodeURIComponent(item.link)}`
        }
        key={item.label}
        onClick={() => {
          navBarContext.setTab(item.label);
          if (matches) {
            close();
          }
        }}
      >
        <Button
          fullWidth
          variant="transparent"
          size="md"
          className={classes.link}
          data-active={item.label === navBarContext.getTab() || undefined}
        >
          <NavBarIconGenerator iconItem={item} />
          <span>{item.label}</span>
        </Button>
      </Link>
    );
  });

  const actions = rootData?.navActions.map((item) => {
    if (item.method === "GET") {
      return (
        <Link to={item.action} key={item.label}>
          <Button
            fullWidth
            variant="transparent"
            size="md"
            className={classes.link}
          >
            <NavBarIconGenerator iconItem={item} />
            <span>{item.label}</span>
          </Button>
        </Link>
      );
    }

    return (
      <Button
        key={item.action}
        fullWidth
        variant="transparent"
        size="md"
        className={classes.link}
        type="button"
        onClick={() => {
          fetcher.submit(null, {
            action: item.action,
            encType: "application/json",
            method: item.method,
          });
        }}
      >
        <NavBarIconGenerator iconItem={item} />
        <span>{item.label}</span>
      </Button>
    );
  });

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Link
            to="/"
            onClick={() => {
              navBarContext.setTab("");
              close();
            }}
          >
            <Group gap={"xs"}>
              <Text c="yellow.5" size="xl">
                <IconDeviceAnalytics stroke={1.5} size={30} />
              </Text>
              <Text c="yellow.5" size="xl">
                Crypexlog
              </Text>
            </Group>
          </Link>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        {rootData ? (
          <nav
            className={classes.navbar}
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <div className={classes.navbarMain}>{links}</div>
            <Divider />
            <div className={classes.footer}>{actions}</div>
            <Box>
              <Text size="sm" c="dimmed" ta="center" mt="md">
                2024 Crypexlog
              </Text>
              <Text size="sm" c="dimmed" ta="center" mt="xs">
                Made with 💖 from the Maldives
              </Text>
            </Box>
          </nav>
        ) : (
          <Fragment>
            {Array(15)
              .fill(0)
              .map((_, index) => (
                <Skeleton key={index} h={28} mt="sm" animate={false} />
              ))}{" "}
          </Fragment>
        )}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
