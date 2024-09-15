import { Alert, Button, Drawer, Grid, TextInput, Title } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  TypedResponse,
  json,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { useEffect } from "react";
import { z } from "zod";
import { useValidationHook } from "~/hooks/validationHook";
import { authUser, authUserRegistrationSchema } from "~/lib/auth.server";
import { userModel } from "~/lib/models/user.server";

type InputErrors = z.inferFormattedError<typeof authUserRegistrationSchema>;

type ActionResponse =
  | {
      type: "input-error";
      issues: InputErrors;
    }
  | {
      type: "success";
    };

export async function action({
  request,
  context,
}: ActionFunctionArgs): Promise<TypedResponse<ActionResponse>> {
  let loggedIn = false;
  try {
    const requestObjCloneForAuthCheck = request.clone();
    await authUser({
      request: requestObjCloneForAuthCheck,
    });
    loggedIn = true;
  } catch (e) {}

  if (loggedIn) {
    throw redirect("/");
  }

  const form = await request.formData();
  const { ...formData } = Object.fromEntries(form);

  const validatedForm = await authUserRegistrationSchema.safeParseAsync(
    formData
  );

  if (!validatedForm.success) {
    const error = validatedForm.error.format();
    return json({
      type: "input-error",
      issues: error,
    });
  }

  await userModel.mutation.create({
    userName: validatedForm.data.user_name,
    password: validatedForm.data.password_1,
  });

  throw redirect("/login");
}

export async function loader({ request }: LoaderFunctionArgs) {
  let loggedIn = false;
  try {
    await authUser({
      request: request,
    });
    loggedIn = true;
  } catch (e) {}

  if (loggedIn) {
    throw redirect("/");
  }

  return json({});
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const actionData = useActionData<typeof action>();
  const { getIssue, clearIssue, setIssues } = useValidationHook<InputErrors>();
  const matches = useMediaQuery("(max-width: 40em)", true, {
    getInitialValueInEffect: false,
  });

  const gridColProps = { lg: 12 };

  const [isOpen, { open, close }] = useDisclosure(false, {
    onClose() {
      setTimeout(() => navigate("/"), 100);
    },
  });

  useEffect(() => {
    open();
  }, []);

  useEffect(() => {
    if (actionData?.type === "input-error") {
      setIssues(actionData.issues);
    }
    if (actionData?.type === "success") {
      setIssues(undefined);
      close();
    }
  }, [actionData]);

  return (
    <Drawer
      title={
        <Title component="span" order={4}>
          Register Today
        </Title>
      }
      // size="lg"
      size={matches ? "lg" : "md"}
      position="right"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      opened={isOpen}
      onClose={close}
    >
      <Form method="POST">
        <Grid>
          <Grid.Col span={gridColProps}>
            <TextInput
              withAsterisk
              defaultValue={undefined}
              name="user_name"
              label="Username"
              error={getIssue("user_name")}
              onChange={() => clearIssue("user_name")}
              readOnly={state !== "idle"}
            />
          </Grid.Col>
          <Grid.Col span={gridColProps}>
            <TextInput
              type="password"
              withAsterisk
              defaultValue={undefined}
              name="password_1"
              label="Password"
              error={getIssue("password_1")}
              onChange={() => clearIssue("password_1")}
              readOnly={state !== "idle"}
            />
          </Grid.Col>
          <Grid.Col span={gridColProps}>
            <TextInput
              type="password"
              withAsterisk
              defaultValue={undefined}
              name="password_2"
              label="Confirm Password"
              error={getIssue("password_2")}
              onChange={() => clearIssue("password_2")}
              readOnly={state !== "idle"}
            />
          </Grid.Col>
          <Grid.Col span={gridColProps}>
            <Button type="submit" fullWidth loading={state !== "idle"}>
              Register
            </Button>
          </Grid.Col>
          <Grid.Col>
            <Alert>
              Please make sure you remember your email and password. We havent
              implemented a Forget Password yet.
            </Alert>
          </Grid.Col>
        </Grid>
      </Form>
    </Drawer>
  );
}
