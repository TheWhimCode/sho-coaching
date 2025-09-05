// next.config.mjs
/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  isDev ? "'unsafe-eval'" : "",
  "https://js.stripe.com",
].filter(Boolean).join(" ");

const connectSrc = [
  "'self'",
  "https://api.stripe.com",
  "https://m.stripe.network",
  "https://r.stripe.com", // Stripe analytics/pixel
  isDev ? "ws:" : "",
  isDev ? "wss:" : "",
].filter(Boolean).join(" ");

const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https://*.stripe.com", // covers r.stripe.com too
].join(" ");

const csp = [
  `default-src 'self'`,
  `script-src ${scriptSrc}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${imgSrc}`,
  `font-src 'self' data:`,
  `frame-src https://js.stripe.com https://hooks.stripe.com`,
  `connect-src ${connectSrc}`,
  `worker-src 'self' blob:`,
  `media-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig = {
  eslint: { ignoreDuringBuilds: true }, // lets you deploy while we fix lint

  async headers() {
    const baseHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Stripe/OAuth popups play nicer with allow-popups:
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      { key: "Content-Security-Policy", value: csp }, // keep CSP last
    ];

    // ✅ only send HSTS in production
    if (!isDev) {
      baseHeaders.unshift({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: baseHeaders,
      },
    ];
  },
};

export default nextConfig;
