// Mock KV
export const ratelimit = () => ({
  limit: () => ({
    success: true,
    limit: 10,
    remaining: 10,
    reset: Date.now() + 60000,
  }),
}); 