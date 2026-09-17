import { Starburst } from '@/components/motifs/Starburst';
import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <Starburst className="h-10 w-10 text-mustard" />
      <h1>Page not found</h1>
      <p className="max-w-md">The page you are looking for does not exist or has moved.</p>
      <ButtonLink href="/" className="mt-2">
        Back to home
      </ButtonLink>
    </div>
  );
}
