import {
  CompactEncrypt,
  JWK,
  compactDecrypt,
  exportJWK,
  generateSecret,
  importJWK,
} from "jose";

export const generateKey = async () => {
  const key = await generateSecret("A256GCM", {
    extractable: true,
  });
  return exportJWK(key);
};

export const simpleEncrypt = async (message: string, key: string) => {
  const jwk = {
    kty: "oct",
    k: key,
    alg: "A256GCM",
    ext: true,
  } satisfies JWK;

  const secretKey = await importJWK(jwk, "A256GCM");
  const encoder = new TextEncoder();
  const jwe = await new CompactEncrypt(encoder.encode(message))
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(secretKey);

  return jwe;
};

export const simpleDecrypt = async (jwe: string, key: string) => {
  const jwk = {
    kty: "oct",
    k: key,
    alg: "A256GCM",
    ext: true,
  } satisfies JWK;

  const secretKey = await importJWK(jwk, "A256GCM");
  const { plaintext } = await compactDecrypt(jwe, secretKey);
  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
};
