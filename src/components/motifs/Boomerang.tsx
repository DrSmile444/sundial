type BoomerangProps = {
  className?: string;
  color?: string;
};

export function Boomerang({ className, color = 'currentColor' }: BoomerangProps) {
  return (
    <svg
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 52C24 8 46 4 60 24C74 44 96 40 116 12"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
