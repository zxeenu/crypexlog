import { Divider, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { LoaderFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authUser } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  let welcomeText = "Welcome to Crypexlog, Brother!";

  try {
    const user = await authUser({
      request: request,
    });

    const regDateTime = new Date(user.created_at);
    const regDay = regDateTime.getDay();
    const regMonth = regDateTime.getMonth();
    const regYear = regDateTime.getFullYear();

    const todayDateTime = new Date();
    const curDay = todayDateTime.getDay();
    const curMonth = todayDateTime.getMonth();
    const curYear = todayDateTime.getFullYear();

    if (regDay === curDay && regMonth === curMonth && regYear === curYear) {
      welcomeText = `Welcome to Crypexlog, ${user.user_name}!`;
    } else {
      welcomeText = `Welcome back to Crypexlog, ${user.user_name}!`;
    }
  } catch (e) {}

  return json({
    welcomeText,
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: "Crypexlog" },
    { name: "description", content: "Welcome to Crypexlog!" },
  ];
};

export default function IndexPage() {
  const { welcomeText } = useLoaderData<typeof loader>();

  return (
    <Paper p="lg">
      <Group justify="space-between">
        <Title order={4}>{welcomeText}</Title>
      </Group>
      <Divider my="md" variant="dashed" />
      <Stack>
        <Group justify="space-between">
          <Text>This is a simple inventory management app.</Text>
        </Group>
      </Stack>
    </Paper>
  );
}
