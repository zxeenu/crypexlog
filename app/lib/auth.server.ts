import { redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { z } from "zod";
import { simpleDecrypt, simpleEncrypt } from "~/lib/crypto.server";
import { env } from "~/lib/env.server";
import { userModel } from "~/lib/models/user.server";
import { sessionStorage } from "~/lib/session.server";

type AccessToken = {
  token: string;
};
export let authenticator = new Authenticator<AccessToken>(sessionStorage);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const userName = String(form.get("user_name"));
    const password = String(form.get("password"));
    const userData = await userModel.data.getUserHashAndPublicId(userName);

    if (!userData) {
      throw new Error("User hasnt registered");
    }

    const passwordHash = userData.userAuth.at(0)?.password;

    if (!passwordHash) {
      throw new Error("Hash does not exist");
    }

    const match = bcrypt.compareSync(password, passwordHash);
    if (!match) {
      throw new Error("Incorrect credentials");
    }

    const k = await env("SESSION_CIPHER_KEY");
    const encryptedPublicId = await simpleEncrypt(userData.public_id, k);

    const userToken = {
      token: encryptedPublicId,
    } satisfies AccessToken;

    // the type of this user must match the type you pass to the Authenticator
    // the strategy will automatically inherit the type if you instantiate
    // directly inside the `use` method
    return userToken;
  }),
  // each strategy has a name and can be changed to use another one
  // same strategy multiple times, especially useful for the OAuth2 strategy.
  "user-pass"
);

type MiddlewareType = "internal";

export async function authUser({
  request,
  middleware = [],
}: {
  request: Request;
  middleware?: MiddlewareType[];
}) {
  const rawUrl = request.url;
  const encodedUrl = encodeURIComponent(rawUrl);

  const tokenContainer = await authenticator.isAuthenticated(request);

  if (!tokenContainer) {
    throw redirect(`/login?redirectTo=${encodedUrl}`);
  }

  const k = await env("SESSION_CIPHER_KEY");

  let decryptedPublicId: null | string = null;
  try {
    decryptedPublicId = await simpleDecrypt(tokenContainer.token, k);
  } catch (e) {}

  if (!decryptedPublicId) {
    throw redirect(`/login?redirectTo=${encodedUrl}`);
  }

  const userData = await userModel.data.getUserByPublicId(decryptedPublicId);

  if (!userData) {
    throw redirect(`/login?redirectTo=${encodedUrl}`);
  }

  return userData;
}

export const loginSchema = z
  .object({
    user_name: z.string().min(5),
    password: z.string().min(8),
  })
  .superRefine(async (arg, ctx) => {
    const userData = await userModel.data.getUserHashAndPublicId(arg.user_name);

    if (!userData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid",
        path: ["user_name"],
        fatal: true,
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid",
        path: ["password"],
        fatal: true,
      });
      return z.NEVER;
    }

    if (!userData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid",
        path: ["user_name"],
        fatal: true,
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid",
        path: ["password"],
        fatal: true,
      });
      return z.NEVER;
    }

    const passwordHash = userData.userAuth.at(0)?.password;

    if (!passwordHash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid",
        path: ["user_name"],
        fatal: true,
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid",
        path: ["password"],
        fatal: true,
      });
      return z.NEVER;
    }
    const match = bcrypt.compareSync(arg.password, passwordHash);

    if (!match) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid",
        path: ["user_name"],
        fatal: true,
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid",
        path: ["password"],
        fatal: true,
      });
      return z.NEVER;
    }
  });

export const authUserRegistrationSchema = z
  .object({
    user_name: z.string().min(5),
    password_1: z.string().min(8),
    password_2: z.string().min(8),
  })
  .superRefine(async (arg, ctx) => {
    const requirements = [
      { re: /[0-9]/, label: "Includes number" },
      { re: /[a-z]/, label: "Includes lowercase letter" },
      { re: /[A-Z]/, label: "Includes uppercase letter" },
      { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: "Includes special symbol" },
    ];

    let failedRequirments = false;
    requirements.forEach((requirement) => {
      if (!requirement.re.test(arg.password_1)) {
        failedRequirments = true;

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: requirement.label,
          path: ["password_1"],
        });
      }
    });

    if (arg.password_1 !== arg.password_2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["password_1"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["password_2"],
      });
    }

    const userData = await userModel.data.getUserHashAndPublicId(arg.user_name);
    if (userData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Username taken",
        path: ["user_name"],
      });
    }
  });
