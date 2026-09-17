import Link from 'next/link';
import { Starburst } from '@/components/motifs/Starburst';

const links = [
  { href: '/rooms', label: 'Rooms' },
  { href: '/about', label: 'About' },
  { href: '/manage', label: 'Manage booking' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-sand bg-ground/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold no-underline">
          <Starburst className="h-6 w-6 text-burnt" />
          <span className="font-display text-xl tracking-tight text-ink">Sundial</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-6 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink no-underline hover:text-teal"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
