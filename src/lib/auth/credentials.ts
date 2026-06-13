import { timingSafeEqual } from "crypto";

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminCredentials(
  email: string,
  password: string,
): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return false;
  }

  return (
    safeEqual(email.trim().toLowerCase(), adminEmail) &&
    safeEqual(password, adminPassword)
  );
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}
