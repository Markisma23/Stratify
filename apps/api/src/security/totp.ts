import { createHmac } from "node:crypto";

const timestepSeconds = 30;

const hotp = (secret: string, counter: number) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac("sha1", Buffer.from(secret, "hex")).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 1_000_000).padStart(6, "0");
};

export const verifyTotp = (secretHex: string, token: string, now = Date.now()) => {
  const counter = Math.floor(now / 1000 / timestepSeconds);
  for (const drift of [-1, 0, 1]) {
    if (hotp(secretHex, counter + drift) === token) {
      return true;
    }
  }
  return false;
};
