import type { Metadata } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { Divider } from '@/components/motifs/Divider';
import { Boomerang } from '@/components/motifs/Boomerang';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'About',
  description:
    'The story of Sundial, a 1957 desert hotel restored for guests who love mid-century design.',
};

const facts = [
  { label: 'Rooms', value: '24' },
  { label: 'Pool', value: '1 saltwater' },
  { label: 'Built', value: '1957' },
];

export default function AboutPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-body text-sm uppercase tracking-[0.2em] text-teal">Our story</p>
        <h1 className="mt-3">A desert hotel built for slower afternoons</h1>
        <Divider />
        <p className="text-lg">
          Sundial opened in 1957 at the edge of Palm Springs, when architects were reshaping the
          desert with clean lines, wide overhangs, and glass that let the landscape in. A ground-up
          restoration in the 2020s kept the original steel-frame structure, the terrazzo floors, and
          the pool deck, while bringing the rooms, plumbing, and wiring fully up to date.
        </p>
        <p>
          The property sits low against the San Jacinto mountains. Every room opens onto a shared
          courtyard, and the saltwater pool stays the social center of the hotel from breakfast
          through the last light of the day.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {facts.map((fact) => (
          <Card key={fact.label} className="text-center">
            <p className="font-display text-3xl text-burnt">{fact.value}</p>
            <p className="mt-2 text-sm uppercase tracking-wide text-ink/70">{fact.label}</p>
          </Card>
        ))}
      </div>

      <div className="relative mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          // eslint-disable-next-line @next/next/no-img-element -- external picsum source, no remote-image config owned by this task
          <img
            key={n}
            src={`https://picsum.photos/seed/sundial-about-${String(n)}/1600/900`}
            alt="Sundial hotel exterior and grounds"
            className="aspect-4/3 w-full rounded-card object-cover"
          />
        ))}
        <Boomerang className="absolute -top-10 right-0 hidden h-10 w-20 text-mustard sm:block" />
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <h2>Ready to see it for yourself</h2>
        <p className="max-w-xl">
          Browse the rooms and pick your dates. Reservations are held without prepayment: you pay at
          the property when you arrive.
        </p>
        <ButtonLink href="/rooms">See rooms</ButtonLink>
      </div>
    </PageShell>
  );
}
