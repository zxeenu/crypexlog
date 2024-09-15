import { Button, Drawer, Grid, Text, TextInput, Title } from "@mantine/core";
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
  Link,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { nanoid } from "nanoid";
import { useEffect } from "react";
import { z } from "zod";
import { useValidationHook } from "~/hooks/validationHook";
import { authUser, authenticator, loginSchema } from "~/lib/auth.server";
import { validateSearchParams } from "~/lib/validation";

type InputErrors = z.inferFormattedError<typeof loginSchema>;

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

  const requestObjClone = request.clone();
  const validatedSearchParams = validateSearchParams(
    requestObjClone,
    z.object({
      redirectTo: z
        .string()
        .min(5)
        .transform((x) => decodeURIComponent(x))
        .pipe(z.string().url()),
    })
  );

  let redirectUrlForSuccess = "/";
  if (validatedSearchParams.success) {
    redirectUrlForSuccess = validatedSearchParams.data.redirectTo;
  }

  const form = await requestObjClone.formData();
  const { ...formData } = Object.fromEntries(form);

  // first level validation
  const validatedForm = await loginSchema.safeParseAsync(formData);

  if (!validatedForm.success) {
    const error = validatedForm.error.format();
    return json({
      type: "input-error",
      issues: error,
    });
  }

  // second level of validation + cookie creation
  return await authenticator.authenticate("user-pass", request, {
    successRedirect: redirectUrlForSuccess,
    failureRedirect: "/login",
    context, // optional
  });
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

  const forceKey = nanoid();

  return json({
    forceKey,
  });
}

export default function LoginPage() {
  const { forceKey } = useLoaderData<typeof loader>();
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

  // when the user in unloggin in state, keeps trying navigating the routes really fast,
  // it causes a drawer error
  useEffect(() => {
    if (!isOpen) {
      open();
    }
  }, [forceKey]);

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
          Login
        </Title>
      }
      position="right"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      size={matches ? "lg" : "md"}
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
              name="password"
              label="Password"
              error={getIssue("password")}
              onChange={() => clearIssue("password")}
              readOnly={state !== "idle"}
            />
          </Grid.Col>
          <Grid.Col span={gridColProps}>
            <Button type="submit" fullWidth loading={state !== "idle"}>
              Login
            </Button>
          </Grid.Col>
        </Grid>
      </Form>

      <Grid>
        <Grid.Col span={gridColProps} mt={15}>
          <Text size="sm">Don't have an account yet?</Text>
        </Grid.Col>
        <Grid.Col span={gridColProps} pt={0}>
          <Link to={"/register"}>
            <Button
              type="button"
              variant="light"
              fullWidth
              loading={state !== "idle"}
            >
              Register Today
            </Button>
          </Link>
        </Grid.Col>
      </Grid>
    </Drawer>
  );
}
