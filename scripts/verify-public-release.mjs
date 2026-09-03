const origins = [
  "https://thepassageapp.io",
  "https://passage-authority-demo.vercel.app",
];

const publicPaths = [
  "/",
  "/about",
  "/contact",
  "/integrations",
  "/pricing",
  "/pilot",
  "/resources",
  "/resources/financial-poa-operations",
  "/resources/decision-receipts",
  "/resources/hosted-first-integration",
  "/security",
  "/templates",
  "/legal/privacy",
  "/legal/terms",
  "/legal/authorized-use",
  "/start",
];

const fakeToken = "0".repeat(64);
const recoveryCases = [
  {
    path: `/r/${fakeToken}`,
    expected: "This secure link is not available. Ask the institution to send a new invitation.",
  },
  {
    path: `/r/${fakeToken}?error=link_used`,
    expected: "This one-time link has already been used. Continue from the device where it was opened or ask the institution for a new invitation.",
  },
  {
    path: `/r/${fakeToken}?error=link_expired`,
    expected: "This secure link has expired. Ask the institution to send a new invitation.",
  },
  {
    path: "/request/00000000-0000-4000-8000-000000000000/overview",
    expected: "Your secure session is unavailable",
  },
];

async function read(origin, path) {
  const response = await fetch(new URL(path, origin), {
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${origin}${path} returned ${response.status}`);
  }
  return body;
}

let routeCount = 0;
let recoveryCount = 0;

for (const origin of origins) {
  for (const path of publicPaths) {
    await read(origin, path);
    routeCount += 1;
  }

  for (const recoveryCase of recoveryCases) {
    const body = await read(origin, recoveryCase.path);
    if (!body.includes(recoveryCase.expected)) {
      throw new Error(`${origin}${recoveryCase.path} did not render the expected recovery guidance`);
    }
    recoveryCount += 1;
  }
}

console.log(`Public release verification passed: ${routeCount} routes and ${recoveryCount} recovery states.`);
