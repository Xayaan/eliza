import { PubMedArticle, PubMedCache } from '../types';

export class PubMedMemoryCache implements PubMedCache {
  private cache: Map<string, { data: PubMedArticle[]; timestamp: number }>;
  private cacheDuration: number;

  constructor(cacheDurationSeconds: number) {
    this.cache = new Map();
    this.cacheDuration = cacheDurationSeconds * 1000;
  }

  get(key: string): PubMedArticle[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, value: PubMedArticle[]): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
