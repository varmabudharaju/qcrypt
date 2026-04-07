import { describe, it, expect } from 'vitest';
import { shouldFail } from '../../src/ci/exit.js';

describe('CI exit', () => {
  it('fails when grade equals threshold', () => {
    expect(shouldFail('C', 'C')).toBe(true);
  });

  it('fails when grade is worse than threshold', () => {
    expect(shouldFail('D', 'C')).toBe(true);
  });

  it('passes when grade is better than threshold', () => {
    expect(shouldFail('B', 'C')).toBe(false);
  });
});
