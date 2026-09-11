import { prisma } from "./prisma";

let lastCheckTime = 0;
let cachedReachable = false;
let isFirstCheck = true;
const CHECK_COOLDOWN = 15000; // 15 seconds

/**
 * Checks if the configured PostgreSQL database is currently reachable with a fast timeout (400ms)
 * to ensure offline testing and local evaluation never experience TCP socket stalls.
 */
export async function isDatabaseOnline(): Promise<boolean> {
  const now = Date.now();

  if (!isFirstCheck && !cachedReachable && now - lastCheckTime < CHECK_COOLDOWN) {
    return false;
  }

  isFirstCheck = false;
  lastCheckTime = now;

  try {
    const probe = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("DB_PROBE_TIMEOUT")), 400)
    );

    await Promise.race([probe, timeout]);
    cachedReachable = true;
    return true;
  } catch {
    cachedReachable = false;
    return false;
  }
}
