import { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return authenticator.logout(request, {
    redirectTo: "/",
  });
}
