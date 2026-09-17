import { Starburst } from './Starburst';

export function Divider() {
  return (
    <div className="flex items-center justify-center gap-4 py-2" role="presentation">
      <span className="h-px w-16 bg-mustard sm:w-24" />
      <Starburst className="h-4 w-4 text-mustard" />
      <span className="h-px w-16 bg-mustard sm:w-24" />
    </div>
  );
}
