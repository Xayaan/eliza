import { z } from 'zod';
import { PubmedConfigSchema, PubmedSearchParamsSchema } from './schema';

export type PubMedConfig = z.infer<typeof PubmedConfigSchema>;
export type PubMedSearchParams = z.infer<typeof PubmedSearchParamsSchema>;
import { ActionResponse } from '@elizaos/core';

export interface PubMedActionInput {
  query?: string;
  maxResults?: number;
}

export interface PubMedActionOutput extends ActionResponse {
  articles: Array<{
    id: string;
    title: string;
    abstract: string;
    url: string;
    publishDate: string;
  }>;
}
export interface PubMedArticle {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  publicationDate: string;
  journal: string;
  doi?: string;
  url: string;
}

export interface PubMedResponse {
  success: boolean;
  data?: PubMedArticle[];
  error?: string;
}

export interface PubMedCache {
  get(key: string): PubMedArticle[] | null;
  set(key: string, value: PubMedArticle[]): void;
  clear(): void;
}

export interface PubMedActionResponse {
  success: boolean;
  data?: {
    articles: PubMedArticle[];
    tweetId?: string;
  };
  error?: string;
}
