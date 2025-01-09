// src/config.ts
import { z } from 'zod';

export const Config = z.object({
  pubmed: z.object({
    apiKey: z.string().optional(),
    searchInterval: z.number().default(30), // minutes
    maxResults: z.number().default(5)
  })
});

export type ConfigType = z.infer<typeof Config>;
