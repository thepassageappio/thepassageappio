const buckets = new Map();

function nowMs() {
  return Date.now();
}

function sweepExpired(currentTime) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= currentTime) buckets.delete(key);
  }
}

export function getRequestIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(firstForwarded || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 80) || 'unknown';
}

export function rateLimit({ key, windowSeconds, maxRequests }) {
  const currentTime = nowMs();
  sweepExpired(currentTime);

  const bucketKey = String(key || 'anonymous').slice(0, 240);
  const windowMs = Math.max(1, Number(windowSeconds || 60)) * 1000;
  const limit = Math.max(1, Number(maxRequests || 30));
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= currentTime) {
    const resetAt = currentTime + windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt, limit };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    limit,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000)),
  };
}
