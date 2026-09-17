import type { Metadata } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { ManageLookupForm } from '@/components/booking/ManageLookupForm';

export const metadata: Metadata = {
  title: 'Manage booking',
  description: 'Open a Sundial reservation with its reference and the email address on it.',
};

export default function ManagePage() {
  return (
    <PageShell>
      <p className="font-body text-sm uppercase tracking-[0.2em] text-teal">Your stay</p>
      <h1 className="mt-3">Manage a reservation</h1>
      <p className="mt-4 max-w-xl">
        Enter the reference from your confirmation and the email address it was sent to. No account
        needed.
      </p>
      <ManageLookupForm />
    </PageShell>
  );
}
