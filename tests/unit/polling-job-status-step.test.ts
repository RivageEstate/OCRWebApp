import { describe, expect, it } from 'vitest';
import { getActiveStep } from '../../apps/web/app/components/PollingJobStatus';

describe('getActiveStep', () => {
  it('returns 1 for queued', () => {
    expect(getActiveStep('queued')).toBe(1);
  });

  it('returns 1 for processing', () => {
    expect(getActiveStep('processing')).toBe(1);
  });

  it('returns 2 for succeeded', () => {
    expect(getActiveStep('succeeded')).toBe(2);
  });

  it('returns -1 for failed', () => {
    expect(getActiveStep('failed')).toBe(-1);
  });
});
