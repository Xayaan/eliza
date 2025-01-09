import { z } from 'zod';

export const PubmedConfigSchema = z.object({
  api_key: z.string(),
  max_results: z.number().min(1).max(100).default(10),
  cache_duration: z.number().min(0).default(3600),
  rate_limit: z.object({
    requests: z.number().min(1).default(3),
    per_second: z.number().min(1).default(1)
  }).optional()
});

export const PubmedSearchParamsSchema = z.object({
  query: z.string().min(1),
  max_results: z.number().min(1).max(100).optional(),
  sort: z.enum(['relevance', 'date']).optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});
