import { z } from 'zod';

export const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  COHERE_API_KEY: z.string().min(1),
  LANGSMITH_API_KEY: z.string().min(1),
  LANGSMITH_PROJECT: z.string().min(1),
  LANGSMITH_TRACING: z.enum(['true', 'false']).default('true'),
  QDRANT_URL: z.string().url(),
  REDIS_URL: z.string().min(1),
  EMBEDDING_MODEL: z.string().min(1),
  GRADING_MODEL: z.string().min(1),
  GENERATION_MODEL: z.string().min(1),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
