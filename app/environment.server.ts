import z from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string(),
  SESSION_SECRET: z.string(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  console.error("Invalid environment variables provided, please fix", result.error.message);
  process.exit();
}
export const Env = result.data;
