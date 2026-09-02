export async function refreshSessionClaims(getClaims: () => Promise<unknown>) {
  try {
    await getClaims();
    return "refreshed" as const;
  } catch {
    // The proxy only refreshes browser auth. Protected pages and commands still
    // perform their own claim and authorization checks, so a transient refresh
    // failure should degrade to a signed-out experience instead of hanging.
    return "unavailable" as const;
  }
}
