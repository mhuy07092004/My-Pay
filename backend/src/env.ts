import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  PORT: z.coerce.number().int().default(3001),
  CORS_ORIGIN: z
    .string()
    .optional()
    .transform((value) => value || undefined),
})

export type Env = z.infer<typeof schema>

export function loadEnv(): Env {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  return parsed.data
}
