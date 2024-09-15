import {
  ActionIcon,
  Button,
  CopyButton,
  Image,
  Text,
  Tooltip,
  rem,
} from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { Link } from "@remix-run/react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import QRCode from "qrcode";

export const QrModal = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{ string: string }>) => {
  const generateQrImageString = (data: string) => {
    let urlString: null | string = null;
    QRCode.toDataURL(
      data,
      {
        type: "image/webp",
        rendererOpts: {
          quality: 1,
        },
      },
      function (err, url) {
        if (err) {
          urlString = null;
        }
        urlString = url;
      }
    );
    return urlString;
  };

  const qrCode = generateQrImageString(innerProps.string);
  const url = innerProps.string;
  return (
    <>
      <Image radius="md" src={qrCode} />
      <CopyButton value={url} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? "Copied" : "Copy"} withArrow>
            <Text c="teal.8" style={{ cursor: "pointer" }} onClick={copy}>
              {url}
            </Text>
          </Tooltip>
        )}
      </CopyButton>
      <Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
        Close
      </Button>
    </>
  );
};
