type StarburstProps = {
  className?: string;
  color?: string;
  rays?: number;
};

export function Starburst({ className, color = 'currentColor', rays = 12 }: StarburstProps) {
  const center = 50;
  const outer = 48;
  const inner = 20;
  const points = Array.from({ length: rays * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / rays;
    const x = center + radius * Math.sin(angle);
    const y = center - radius * Math.cos(angle);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <polygon points={points} fill={color} />
    </svg>
  );
}
