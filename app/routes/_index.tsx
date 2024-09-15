import { Divider, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { LoaderFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    welcomeText: "Welcome, brother man",
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
