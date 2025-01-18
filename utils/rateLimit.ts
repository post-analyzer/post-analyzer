const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_ATTEMPTS = 5;

let attempts = 0;
let windowStart = Date.now();

export function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - windowStart > RATE_LIMIT_WINDOW) {
    attempts = 0;
    windowStart = now;
  }

  if (attempts >= MAX_ATTEMPTS) {
    return false;
  }

  attempts++;
  return true;
}

export function getRemainingTime(): number {
  return Math.max(0, RATE_LIMIT_WINDOW - (Date.now() - windowStart));
}

