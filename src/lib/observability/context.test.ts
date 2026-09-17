import { describe, expect, it } from 'vitest';
import { redact } from './context';

describe('redact', () => {
  it('keeps the identifiers a log line is built from', () => {
    expect(
      redact({ roomSlug: 'atomic-suite', reference: 'SD-EEQNHR', conflicts: 0, available: true }),
    ).toEqual({ roomSlug: 'atomic-suite', reference: 'SD-EEQNHR', conflicts: 0, available: true });
  });

  it('drops the guest behind the booking', () => {
    const fields = redact({
      reference: 'SD-EEQNHR',
      guestName: 'Marianne Shaw',
      guestEmail: 'marianne.shaw@example.com',
      guestPhone: '+1 760 555 0111',
    });

    expect(fields).toEqual({ reference: 'SD-EEQNHR' });
  });

  it('drops credentials whatever they are called', () => {
    expect(redact({ authorization: 'Bearer abc', apiToken: 'xyz', dbSecret: 'shh' })).toEqual({});
  });

  it('leaves out fields that were never set', () => {
    expect(redact({ sort: 'top-rated', checkIn: undefined })).toEqual({ sort: 'top-rated' });
  });
});
