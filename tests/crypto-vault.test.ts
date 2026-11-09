import { describe, it, expect } from "vitest";
import { seal, open, fingerprint, generateMasterKey, DecryptionError } from "../lib/crypto/vault";

describe("Crypto Vault - AES-256-GCM Envelope & Fingerprinting", () => {
  it("should generate a 32-byte base64 master key", () => {
    const key = generateMasterKey();
    expect(typeof key).toBe("string");
    const buf = Buffer.from(key, "base64");
    expect(buf.length).toBe(32);
  });

  it("should encrypt and decrypt a secret round-trip with correct AAD", () => {
    const secret = "sk-test-secret-key-12345-enterprise";
    const aad = "cred_12345:groq";

    const sealed = seal(secret, aad);
    expect(sealed.ciphertext).toBeInstanceOf(Buffer);
    expect(sealed.iv).toBeInstanceOf(Buffer);
    expect(sealed.iv.length).toBe(12);
    expect(sealed.authTag).toBeInstanceOf(Buffer);
    expect(sealed.authTag.length).toBe(16);
    expect(sealed.keyVersion).toBe(1);

    const decrypted = open(sealed, aad);
    expect(decrypted).toBe(secret);
  });

  it("should fail decryption if AAD does not match (transplantation protection)", () => {
    const secret = "sk-groq-critical-key";
    const aad = "cred_row_1:groq";
    const wrongAad = "cred_row_2:groq";

    const sealed = seal(secret, aad);
    expect(() => open(sealed, wrongAad)).toThrow(DecryptionError);
  });

  it("should fail decryption if ciphertext is tampered", () => {
    const secret = "sk-gemini-sensitive-key";
    const aad = "cred_abc:gemini";

    const sealed = seal(secret, aad);
    // Tamper ciphertext
    const tamperedCiphertext = Buffer.from(sealed.ciphertext);
    tamperedCiphertext[0] ^= 0xff;

    expect(() =>
      open(
        {
          ...sealed,
          ciphertext: tamperedCiphertext,
        },
        aad,
      ),
    ).toThrow(DecryptionError);
  });

  it("should fail decryption if auth tag is tampered", () => {
    const secret = "sk-mistral-key";
    const aad = "cred_xyz:mistral";

    const sealed = seal(secret, aad);
    const tamperedTag = Buffer.from(sealed.authTag);
    tamperedTag[0] ^= 0xff;

    expect(() =>
      open(
        {
          ...sealed,
          authTag: tamperedTag,
        },
        aad,
      ),
    ).toThrow(DecryptionError);
  });

  it("should compute a deterministic, one-way HMAC-SHA256 fingerprint", () => {
    const secret = "sk-unique-provider-key-999";
    const fp1 = fingerprint(secret);
    const fp2 = fingerprint(secret);
    const fpDifferent = fingerprint(secret + "-other");

    expect(typeof fp1).toBe("string");
    expect(fp1.length).toBe(64); // SHA256 hex length
    expect(fp1).toBe(fp2);
    expect(fp1).not.toBe(fpDifferent);
  });
});
