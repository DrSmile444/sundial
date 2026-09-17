'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f1e7] px-6 py-24 text-center text-[#1f1b16]">
        <h1 className="font-semibold text-3xl">Something went wrong on our side</h1>
        <p className="max-w-md">Please try again.</p>
        {error.digest ? <p className="text-sm opacity-60">Reference: {error.digest}</p> : null}
        <button
          onClick={reset}
          className="mt-2 rounded-[14px] bg-[#d9662b] px-6 py-3 text-sm font-medium text-[#f6f1e7]"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
