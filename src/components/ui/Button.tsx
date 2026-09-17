import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-burnt text-ground hover:bg-mustard',
  secondary: 'bg-transparent text-ink border border-ink hover:border-teal hover:text-teal',
};

const baseClasses =
  'inline-flex items-center justify-center rounded-card px-6 py-3 font-body text-sm font-medium transition-colors no-underline';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props} />;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
};

export function ButtonLink({
  href,
  variant = 'primary',
  className = '',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
