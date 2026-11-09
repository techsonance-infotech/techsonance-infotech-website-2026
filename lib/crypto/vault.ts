import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { getServerEnv } from "@/lib/env/server";

export class DecryptionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DecryptionError";
  }
}

export interface SealedSecret {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  keyVersion: number;
}

export const CURRENT_KEY_VERSION = 1;

/**
 * Generates a cryptographically secure 32-byte master key (KEK) encoded in base64.
 */
export function generateMasterKey(): string {
  return randomBytes(32).toString("base64");
}

function getMasterKey(version: number): Buffer {
  const env = getServerEnv();

  // Versioned master keys mapping
  const keys: Record<number, string | undefined> = {
    1: env.AI_KEK_V1,
  };

  const keyB64 = keys[version];
  if (!keyB64) {
    throw new DecryptionError(`Missing KEK for version ${version}`);
  }

  const keyBuf = Buffer.from(keyB64, "base64");
  if (keyBuf.length !== 32) {
    throw new DecryptionError(
      `Invalid KEK length for version ${version}: expected 32 bytes, got ${keyBuf.length}`,
    );
  }

  return keyBuf;
}

function getFingerprintPepper(): Buffer {
  const env = getServerEnv();
  const pepperStr = env.AI_FP_PEPPER || "techsonance-default-pepper-2026";
  return Buffer.from(pepperStr, "utf-8");
}

/**
 * Seals a plaintext secret using AES-256-GCM.
 * AAD (Additional Authenticated Data) binds ciphertext to its ID and provider slug.
 */
export function seal(plain: string, aad: string): SealedSecret {
  const iv = randomBytes(12);
  const key = getMasterKey(CURRENT_KEY_VERSION);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf-8"));

  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf-8"),
    cipher.final(),
  ]);

  return {
    ciphertext,
    iv,
    authTag: cipher.getAuthTag(),
    keyVersion: CURRENT_KEY_VERSION,
  };
}

/**
 * Opens and decrypts a sealed secret using AES-256-GCM and verifies AAD.
 * Throws DecryptionError if authentication tag or AAD does not match.
 */
export function open(sealed: SealedSecret, aad: string): string {
  try {
    const key = getMasterKey(sealed.keyVersion);
    const decipher = createDecipheriv("aes-256-gcm", key, sealed.iv);

    decipher.setAAD(Buffer.from(aad, "utf-8"));
    decipher.setAuthTag(sealed.authTag);

    const decrypted = Buffer.concat([
      decipher.update(sealed.ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf-8");
  } catch (err) {
    throw new DecryptionError("Failed to decrypt secret: ciphertext or AAD is invalid or tampered", {
      cause: err,
    });
  }
}

/**
 * Computes a deterministic, one-way HMAC-SHA256 fingerprint for duplicate detection
 * and leak detection matching without revealing the underlying plaintext.
 */
export function fingerprint(plain: string): string {
  const pepper = getFingerprintPepper();
  return createHmac("sha256", pepper).update(plain, "utf-8").digest("hex");
}
