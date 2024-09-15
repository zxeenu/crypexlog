import { Box, Center, Group, Paper, Text } from "@mantine/core";
import { IconGhost3 } from "@tabler/icons-react";

type Props = {
  label: string;
};

export default function Empty(props: Props) {
  return (
    <Paper>
      <Center>
        <Box>
          <Group>
            <IconGhost3 size={80} stroke={1} />
            <Text>{props.label}</Text>
          </Group>
        </Box>
      </Center>
    </Paper>
  );
}
