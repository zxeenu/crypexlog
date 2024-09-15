import {
  ActionIcon,
  Box,
  Divider,
  Group,
  Paper,
  TextInput,
  Title,
} from "@mantine/core";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { IconCirclePlus, IconZoom } from "@tabler/icons-react";
import { authUser } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authUser({
    request,
  });

  return json({});
}

export default function BillsPage() {
  return (
    <Paper p="lg">
      <Group justify="space-between">
        <Title order={4}>Buy Actions</Title>
        <Box ml={-25} className="hidden">
          <TextInput
            placeholder="Search"
            radius={20}
            rightSection={<IconZoom />}
          />
        </Box>
        <Link to="/bills/new?mode=create">
          <ActionIcon variant="transparent" className="hide-on-mobile">
            <IconCirclePlus />
          </ActionIcon>
        </Link>
      </Group>
      <Divider my="md" variant="dashed" />
    </Paper>
  );
}
