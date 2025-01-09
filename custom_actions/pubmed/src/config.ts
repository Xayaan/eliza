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

export function validateConfig(config: PubMedConfig): void {
  if (!config.searchTerms || !Array.isArray(config.searchTerms)) {
    throw new Error('Invalid searchTerms configuration');
  }
  if (!config.tweetTemplate) {
    throw new Error('Missing tweet template configuration');
  }
}
