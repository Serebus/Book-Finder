import crypto from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Generate a cryptographically secure random hexadecimal token.
 * Default length is 64 hex characters (32 bytes).
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Hash a plain-text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password with a bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
