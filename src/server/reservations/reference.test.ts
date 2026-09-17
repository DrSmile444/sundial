import { describe, expect, it } from 'vitest';
import { generateReference, REFERENCE_ALPHABET } from './reference';

describe('generateReference', () => {
  it('reads as SD- followed by six characters', () => {
    expect(generateReference()).toMatch(/^SD-[A-Z2-9]{6}$/);
  });

  it('draws only from the spoken alphabet', () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      for (const character of generateReference().slice(3)) {
        expect(REFERENCE_ALPHABET).toContain(character);
      }
    }
  });

  it('leaves out the characters that sound or look alike', () => {
    expect(REFERENCE_ALPHABET).not.toMatch(/[IO01]/);
  });

  it('does not repeat itself across many references', () => {
    const references = new Set(Array.from({ length: 500 }, () => generateReference()));

    expect(references.size).toBe(500);
  });
});
