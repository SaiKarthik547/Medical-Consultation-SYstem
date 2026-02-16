import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
    interval: number; // Time window in ms
    uniqueTokenPerInterval: number; // Max unique IPs
}

export function rateLimit(options: RateLimitOptions) {
    const tokenCache = new LRUCache({
        max: options.uniqueTokenPerInterval || 500,
        ttl: options.interval || 60000,
    });

    return {
        check: (limit: number, token: string): { success: boolean; remaining: number } => {
            const tokenCount = (tokenCache.get(token) as number[]) || [0];
            if (tokenCount[0] === 0) {
                tokenCache.set(token, tokenCount);
            }
            tokenCount[0] += 1;

            const currentUsage = tokenCount[0];
            const isRateLimited = currentUsage >= limit;

            return {
                success: !isRateLimited,
                remaining: limit - currentUsage,
            };
        },
    };
}

// Usage in API routes
export const loginLimiter = rateLimit({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 500,
});
