import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: async (req): Promise<number> => req.apiKeyRateLimit ?? 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req): string => req.apiKeyId ?? req.ip,
});

export async function closeRateLimiterRedis(): Promise<void> {
  return Promise.resolve();
}
