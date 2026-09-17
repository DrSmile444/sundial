import type { ReservationView } from '@/server/reservations';
import { formatGuests, formatStayDate, formatTotal } from '@/components/rooms/format';

export function StatusBadge({ status }: { status: ReservationView['status'] }) {
  const classes =
    status === 'confirmed'
      ? 'border-teal bg-teal/10 text-teal'
      : 'border-burnt bg-burnt/10 text-burnt';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${classes}`}>
      {status}
    </span>
  );
}

export function ReservationFacts({ reservation }: { reservation: ReservationView }) {
  const facts = [
    { label: 'Room', value: reservation.roomName },
    { label: 'Check in', value: formatStayDate(reservation.checkIn) },
    { label: 'Check out', value: formatStayDate(reservation.checkOut) },
    { label: 'Guests', value: formatGuests(reservation.guests) },
    { label: 'Total at the property', value: formatTotal(reservation.totalCents) },
  ];

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-card border border-sand bg-white/60 p-5">
          <dt className="text-xs uppercase tracking-wide text-ink/60">{fact.label}</dt>
          <dd className="mt-1 font-display text-lg">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
