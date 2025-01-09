import { elizaLogger } from "@elizaos/core";

export class RateLimiter {
    private lastRequest: number = 0;
    private minInterval: number = 2000; // 2 seconds

    async wait() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;

        if (timeSinceLastRequest < this.minInterval) {
            await new Promise(resolve =>
                setTimeout(resolve, this.minInterval - timeSinceLastRequest)
            );
        }

        this.lastRequest = Date.now();
    }
}

export const rateLimiter = new RateLimiter();
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private maxRequests: number;
  private refillInterval: number;

  constructor({ maxRequests, perSeconds }: { maxRequests: number; perSeconds: number }) {
    this.maxRequests = maxRequests;
    this.tokens = maxRequests;
    this.lastRefill = Date.now();
    this.refillInterval = (perSeconds * 1000) / maxRequests;
  }

  async waitForToken(): Promise<void> {
    this.refillTokens();
    
    if (this.tokens <= 0) {
      const waitTime = this.refillInterval - (Date.now() - this.lastRefill);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refillTokens();
    }
    
    this.tokens--;
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const refillAmount = Math.floor(timePassed / this.refillInterval);
    
    if (refillAmount > 0) {
      this.tokens = Math.min(this.maxRequests, this.tokens + refillAmount);
      this.lastRefill = now;
    }
  }
}
