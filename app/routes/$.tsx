import { Divider, Group, Paper, Title } from "@mantine/core";
import React from "react";

export default function NotFoundPage() {
  return (
    <Paper p="lg">
      <Group justify="space-between">
        <Title order={4}>Oops!</Title>
      </Group>
      <Divider my="md" variant="dashed" />
      The request page does not exist.
    </Paper>
  );
}
