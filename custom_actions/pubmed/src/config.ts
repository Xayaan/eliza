import { PubMedConfig } from './types';
import { PubmedConfigSchema } from './schema';

export function validateConfig(config: Partial<PubMedConfig>): PubMedConfig {
  const result = PubmedConfigSchema.safeParse(config);
  
  if (!result.success) {
    throw new Error(`Invalid PubMed configuration: ${result.error.message}`);
  }
  
  return result.data;
}

export const DEFAULT_CONFIG: Partial<PubMedConfig> = {
  max_results: 10,
  cache_duration: 3600
};
