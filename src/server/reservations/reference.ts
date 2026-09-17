import { randomBytes } from 'node:crypto';

/** Letters and digits that stay distinct when a reference is read aloud. */
export const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const REFERENCE_LENGTH = 6;

export function generateReference(): string {
  const bytes = randomBytes(REFERENCE_LENGTH);
  let code = '';

  for (const byte of bytes) {
    code += REFERENCE_ALPHABET.charAt(byte % REFERENCE_ALPHABET.length);
  }

  return `SD-${code}`;
}
