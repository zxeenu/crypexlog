import { z } from 'zod'

const envMap = {
  // TURSO_AUTH_TOKEN: z.string().min(1, 'Required'),
  // TURSO_DATABASE_URL: z.string().min(1, 'Required'),
  SESSION_SECRET: z.string().min(1, 'Required'),
  SESSION_CIPHER_KEY: z.string().min(1, 'Required')
} as const

type EnvMap = typeof envMap
type EnvKey = keyof EnvMap

export const env = <K extends EnvKey>(envKey: K): z.infer<EnvMap[K]> => {
  const env_ = envMap?.[envKey]

  if (!env_) {
    throw new Error(`${envKey} env validation schema not found in the envMap`)
  }

  const envVariable = process.env?.[envKey]

  if (!envVariable) {
    throw new Error(`${envKey} env key not found in the .env file`)
  }

  const validatedEvn = env_.safeParse(envVariable)

  if (!validatedEvn.success) {
    throw new Error(`${envKey} env found in .env is not valid`)
  }

  return validatedEvn.data
}
