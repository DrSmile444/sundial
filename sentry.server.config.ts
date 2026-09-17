import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.NEXT_PUBLIC_RELEASE,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
});
