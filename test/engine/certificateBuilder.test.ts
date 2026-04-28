import { describe, it, expect } from 'vitest';
import { generateCertificateId, validatePlayerName } from '../../src/engine/certificateBuilder';

describe('generateCertificateId', () => {
  it('produces expected REX-YYYY-MMDD-XXXX shape', () => {
    const id = generateCertificateId(new Date('2026-04-28T12:00:00Z'));
    expect(id).toMatch(/^REX-2026-\d{4}-[0-9A-F]{4}$/);
  });
});

describe('validatePlayerName', () => {
  it('accepts ASCII identifiers', () => {
    expect(validatePlayerName('PARSER-77')).toBe('PARSER-77');
  });

  it('accepts CJK characters', () => {
    expect(validatePlayerName('解译官·77')).toBe('解译官·77');
  });

  it('rejects empty / whitespace', () => {
    expect(validatePlayerName('')).toBeNull();
    expect(validatePlayerName('   ')).toBeNull();
  });

  it('rejects names longer than 24 chars', () => {
    expect(validatePlayerName('A'.repeat(25))).toBeNull();
  });

  it('rejects emoji and disallowed punctuation', () => {
    expect(validatePlayerName('hello!')).toBeNull();
    expect(validatePlayerName('hi🚀')).toBeNull();
  });
});
