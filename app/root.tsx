import {
  Box,
  Center,
  ColorSchemeScript,
  Divider,
  Group,
  MantineProvider,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import "@mantine/core/styles.css";
import { ModalsProvider } from "@mantine/modals";
import { NavigationProgress, nprogress } from "@mantine/nprogress";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useNavigation,
  useRouteError,
} from "@remix-run/react";
import { IconMoodSmileDizzy, IconProps } from "@tabler/icons-react";
import { useEffect } from "react";
import { DefaultLayout } from "~/components/layout/DefaultLayout/DefaultLayout";
import { NavBarProvider } from "~/context/navBarContext";
import "./tailwind.css";

export const links: LinksFunction = () => [];

type InternalNavLink = {
  label: string;
  link: string;
  icon: string;
  iconProps?: Omit<IconProps, "className">;
  condition: () => boolean;
};

type ExternalNavLink = Omit<InternalNavLink, "condition">;

type InternalNavAction = {
  label: string;
  action: string;
  method: "GET" | "POST";
  icon: string;
  iconProps?: Omit<IconProps, "className">;
  condition: () => boolean;
};

type ExternalNavAction = Omit<InternalNavAction, "condition">;

export async function loader({ request }: LoaderFunctionArgs) {
  let loggedIn = false;
  let user = null;

  const isInternalUser = () => {
    if (!loggedIn) {
      return false;
    }

    return true;
  };

  const allNavLinks: InternalNavLink[] = [
    {
      label: "Friends",
      link: "/friends",
      icon: "lego",
      iconProps: {
        stroke: 1.5,
      },
      condition: () => true,
    },
    {
      label: "Bills",
      link: "/bills",
      icon: "reciept",
      iconProps: {
        stroke: 1.5,
      },
      condition: () => true,
    },
    {
      label: "Users",
      link: "/admin/users",
      icon: "users",
      iconProps: {
        stroke: 1.5,
      },
      condition: () => isInternalUser(),
    },
  ];

  const navLinks: ExternalNavLink[] = allNavLinks.filter((x) => x.condition());

  const allNavActions: InternalNavAction[] = [
    {
      label: "Logout",
      method: "POST",
      action: "/logout",
      icon: "logout",
      iconProps: {
        stroke: 1.5,
      },
      condition: () => loggedIn === true,
    },
    {
      label: "Login",
      method: "GET",
      action: "/login",
      icon: "login",
      iconProps: {
        stroke: 1.5,
      },
      condition: () => loggedIn !== true,
    },
    {
      label: "Register",
      method: "GET",
      action: "/register",
      icon: "key",
      iconProps: {
        stroke: 1.5,
      },
      condition: () => loggedIn !== true,
    },
  ];

  const navActions: ExternalNavAction[] = allNavActions.filter((x) =>
    x.condition()
  );

  return json({
    navLinks,
    navActions,
    loggedIn,
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { state } = useNavigation();

  useEffect(() => {
    if (state !== "idle") {
      nprogress.start();
    }

    if (state === "idle") {
      nprogress.complete();
    }

    return () => nprogress.cleanup();
  }, [state]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider
          defaultColorScheme="dark"
          theme={{
            primaryColor: "yellow",
          }}
        >
          <NavBarProvider>
            <NavigationProgress />
            <ModalsProvider>
              <DefaultLayout>{children}</DefaultLayout>
            </ModalsProvider>
          </NavBarProvider>
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    if (error instanceof Error) {
      const data = {
        message: error?.message,
        stack: error?.stack,
      };
      const url = "api/error_log";

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    }
  }, []);

  return (
    <Paper p="lg">
      <Group justify="space-between">
        <Title order={4}>Oh no, something broke.</Title>
      </Group>
      <Divider my="md" variant="dashed" />
      <Center>
        <Box>
          <Group>
            <IconMoodSmileDizzy size={80} stroke={1} />
            <Text>
              Something unexpected has happaned. Try refreshing if the issue
              persists.
            </Text>
          </Group>
        </Box>
      </Center>
    </Paper>
  );
}
