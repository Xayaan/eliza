export enum PubmedErrorCodes {
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_SEARCH_PARAMS = 'INVALID_SEARCH_PARAMS',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export class PubmedError extends Error {
  constructor(
    public code: PubmedErrorCodes,
    message: string
  ) {
    super(message);
    this.name = 'PubmedError';
  }
}
