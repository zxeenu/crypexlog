import { z } from "zod";

export async function validateAsyncSearchParams<T extends z.AnyZodObject>(
  request: Request,
  validator: T
): Promise<z.SafeParseReturnType<z.input<T>, z.output<T>>> {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(new URLSearchParams(url.search));
  const validatedSearchParams = await validator.spa(searchParams);
  return validatedSearchParams;
}

export function validateSearchParams<T extends z.AnyZodObject>(
  request: Request,
  validator: T
): z.SafeParseReturnType<z.input<T>, z.output<T>> {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(new URLSearchParams(url.search));
  const validatedSearchParams = validator.safeParse(searchParams);
  return validatedSearchParams;
}
