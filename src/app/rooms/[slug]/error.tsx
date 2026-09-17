'use client';

import { Starburst } from '@/components/motifs/Starburst';
import { Button, ButtonLink } from '@/components/ui/Button';

export default function RoomDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <Starburst className="h-10 w-10 text-burnt" />
      <h1>This room could not be shown</h1>
      <p className="max-w-md">Please try again, or browse the other rooms.</p>
      {error.digest ? <p className="text-sm text-ink/60">Reference: {error.digest}</p> : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/rooms" variant="secondary">
          See all rooms
        </ButtonLink>
      </div>
    </div>
  );
}
