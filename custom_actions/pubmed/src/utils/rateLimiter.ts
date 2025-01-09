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