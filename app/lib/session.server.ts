import { createCookieSessionStorage } from "@remix-run/node";
import { env } from "~/lib/env.server";

const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60;

// export the whole sessionStorage object
export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session", // use any name you want here
    sameSite: "lax", // this helps with CSRF
    path: "/", // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    secrets: [env("SESSION_SECRET")], // replace this with an actual secret
    secure: process.env.NODE_ENV === "production", // enable this in prod only
    // secure: false, // enable this in prod only
    maxAge: ONE_WEEK_IN_SECONDS,
  },
});

// you can also export the methods individually for your own usage
export let { getSession, commitSession, destroySession } = sessionStorage;
