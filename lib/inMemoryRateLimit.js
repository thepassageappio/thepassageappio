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
export async function durableRateLimit(admin, options = {}) {
  const fallback = rateLimit(options);
  if (!fallback.allowed) return { ...fallback, durable: false, fallback: 'local_guard' };
  if (!admin || typeof admin.from !== 'function') return { ...fallback, durable: false, fallback: 'missing_admin' };

  const currentTime = nowMs();
  const bucketKey = String(options.key || 'anonymous').slice(0, 240);
  const windowMs = Math.max(1, Number(options.windowSeconds || 60)) * 1000;
  const limit = Math.max(1, Number(options.maxRequests || 30));
  const nowIso = new Date(currentTime).toISOString();
  const nextResetIso = new Date(currentTime + windowMs).toISOString();

  try {
    const { data: existing, error: selectError } = await admin
      .from('rate_limit_buckets')
      .select('key,count,reset_at')
      .eq('key', bucketKey)
      .maybeSingle();

    if (selectError) return { ...fallback, durable: false, fallback: selectError.message || 'rate_limit_select_failed' };

    const existingResetAt = existing?.reset_at ? new Date(existing.reset_at).getTime() : 0;
    if (!existing || !existingResetAt || existingResetAt <= currentTime) {
      const { error: upsertError } = await admin
        .from('rate_limit_buckets')
        .upsert({ key: bucketKey, count: 1, reset_at: nextResetIso, updated_at: nowIso }, { onConflict: 'key' });
      if (upsertError) return { ...fallback, durable: false, fallback: upsertError.message || 'rate_limit_upsert_failed' };
      return { allowed: true, remaining: limit - 1, resetAt: currentTime + windowMs, limit, retryAfterSeconds: Math.ceil(windowMs / 1000), durable: true };
    }

    const nextCount = Number(existing.count || 0) + 1;
    const { error: updateError } = await admin
      .from('rate_limit_buckets')
      .update({ count: nextCount, updated_at: nowIso })
      .eq('key', bucketKey);
    if (updateError) return { ...fallback, durable: false, fallback: updateError.message || 'rate_limit_update_failed' };

    const allowed = nextCount <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - nextCount),
      resetAt: existingResetAt,
      limit,
      retryAfterSeconds: Math.max(1, Math.ceil((existingResetAt - currentTime) / 1000)),
      durable: true,
    };
  } catch (error) {
    return { ...fallback, durable: false, fallback: error?.message || 'rate_limit_failed' };
  }
}