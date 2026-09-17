'use client';

import { Starburst } from '@/components/motifs/Starburst';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <Starburst className="h-10 w-10 text-burnt" />
      <h1>Something went wrong on our side</h1>
      <p className="max-w-md">Please try again.</p>
      {error.digest ? <p className="text-sm text-ink/60">Reference: {error.digest}</p> : null}
      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
