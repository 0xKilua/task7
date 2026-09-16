import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  STORAGE_PROVIDER: z.enum(["s3", "local"]).default("local"),
  LOCAL_STORAGE_DIR: z.string().default(".data/uploads"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_PHOTOS: z.string().default("relook-photos"),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  VISION_SERVICE_URL: z.string().default("http://localhost:8100"),

  AI_PROVIDER: z.string().default("replicate"),
  REPLICATE_API_TOKEN: z.string().optional(),
  REPLICATE_HAIRSTYLE_MODEL_OWNER: z.string().optional(),
  REPLICATE_HAIRSTYLE_MODEL_NAME: z.string().optional(),
  REPLICATE_CLOTHING_MODEL_OWNER: z.string().optional(),
  REPLICATE_CLOTHING_MODEL_NAME: z.string().optional(),

  DATA_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) {
    cached = EnvSchema.parse(process.env);
  }
  return cached;
}
