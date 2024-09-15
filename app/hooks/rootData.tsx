import { useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { loader } from "~/root";

export type RootData =
  | ReturnType<typeof useLoaderData<typeof loader>>
  | undefined;

export function useRootData() {
  const data = useRouteLoaderData("root") as RootData;
  return data;
}
