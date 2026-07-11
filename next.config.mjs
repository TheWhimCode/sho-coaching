/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
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
  "https://r.stripe.com",
  "https://ddragon.leagueoflegends.com", // allow realms fetch
  "https://vimeo.com",
  "https://player.vimeo.com",
  isDev ? "ws:" : "",
  isDev ? "wss:" : "",
].filter(Boolean).join(" ");

const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https://*.stripe.com",
  "https://ddragon.leagueoflegends.com", // allow champion images
  "https://raw.communitydragon.org",     // allow rank emblems (CDragon)
  "https://videos.its-mino.com",
  "https://i.vimeocdn.com",
  "https://vumbnail.com",
].join(" ");

// Build CSP parts (dev: no upgrade-insecure-requests)
const cspParts = [
  `default-src 'self'`,
  `script-src ${scriptSrc}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${imgSrc}`,
  `font-src 'self' data:`,
  `frame-src https://js.stripe.com https://hooks.stripe.com https://player.vimeo.com`,
  `connect-src ${connectSrc}`,
  `worker-src 'self' blob:`,
  `media-src 'self' blob: https://videos.its-mino.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `manifest-src 'self'`,
];
if (!isDev) cspParts.push(`upgrade-insecure-requests`);

const csp = cspParts.join("; ");

const nextConfig = {
  turbopack: {
    root: projectRoot,
  },

  env: {
    PRICING_DISCOUNT_PERCENT: process.env.PRICING_DISCOUNT_PERCENT,
    RUSH_BUNDLE_PRICE_EUR: process.env.RUSH_BUNDLE_PRICE_EUR,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ddragon.leagueoflegends.com" },
      { protocol: "https", hostname: "raw.communitydragon.org" }, // ✅ allow rank emblems
      { protocol: "https", hostname: "videos.its-mino.com" },
    ],
  },

  async redirects() {
    return [
      {
        source: "/guides/viego",
        destination: "/guide",
        permanent: true,
      },
    ];
  },

  async headers() {
    const baseHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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

    // HSTS only in prod
    if (!isDev) {
      baseHeaders.unshift({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
      baseHeaders.push({
        key: "Content-Security-Policy-Report-Only",
        value: `${csp}; report-uri /api/csp/report`,
      });
    }

    const allHeaders = [
      {
        source: "/guide",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/skillcheck/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      { source: "/(.*)", headers: baseHeaders },
    ];
    return allHeaders;
  },
};

export default nextConfig;
