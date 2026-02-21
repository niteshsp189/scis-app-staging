/**
 * Vite Plugin: OG Meta Tags for Social Media Crawlers
 *
 * Intercepts requests from WhatsApp, Telegram, LinkedIn, Facebook, Twitter
 * crawlers and serves lightweight HTML with Open Graph meta tags so that
 * sharing a customer page URL produces a rich link preview.
 *
 * Regular browser requests pass through to Vite / the SPA as usual.
 */

import type { Plugin, ViteDevServer } from "vite";
import http from "http";
import https from "https";

// Crawler user-agent patterns
const CRAWLER_UA_PATTERNS = [
  /WhatsApp/i,
  /TelegramBot/i,
  /facebookexternalhit/i,
  /Facebot/i,
  /LinkedInBot/i,
  /Twitterbot/i,
  /Slackbot/i,
  /Discordbot/i,
  /Googlebot/i,
  /bingbot/i,
  /Applebot/i,
  /PinterestBot/i,
];

// URL patterns that map to customer pages:  /clients/view/:id  /prospects/view/:id  etc.
const CUSTOMER_URL_REGEX =
  /^\/(clients|prospects|formers|deceaseds)\/view\/(\d+)/;

// Map route prefix → display label
const STATUS_MAP: Record<string, string> = {
  clients: "Client",
  prospects: "Prospect",
  formers: "Former",
  deceaseds: "Deceased",
};

function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return CRAWLER_UA_PATTERNS.some((re) => re.test(userAgent));
}

/**
 * Fetch customer preview from the backend public API.
 * Works with both http and https URLs.
 */
function fetchCustomerPreview(
  apiBaseUrl: string,
  customerId: string
): Promise<{
  found: boolean;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  status?: string;
}> {
  return new Promise((resolve) => {
    const url = `${apiBaseUrl}/public/customer-preview/${customerId}`;
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, { timeout: 3000 }, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => (data += chunk.toString()));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ found: false });
        }
      });
    });

    req.on("error", () => resolve({ found: false }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ found: false });
    });
  });
}

function buildOgHtml(
  title: string,
  description: string,
  currentUrl: string,
  ogImage: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:url" content="${escapeHtml(currentUrl)}" />
  <meta property="og:site_name" content="SCIS - Insurance Management System" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <meta name="description" content="${escapeHtml(description)}" />
</head>
<body></body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function ogCrawlerPlugin(): Plugin {
  // Resolve API base URL from env — strip trailing /api if present, then re-add
  let apiBaseUrl = "";

  return {
    name: "vite-plugin-og-crawler",
    configResolved(config) {
      // For server-side fetches (inside Docker), prefer VITE_INTERNAL_API_URL
      // which points to the Docker-internal backend hostname (e.g. http://backend:80/api).
      // Falls back to VITE_API_URL (browser-facing URL) for non-Docker environments.
      const envUrl =
        process.env.VITE_INTERNAL_API_URL ||
        config.env?.VITE_INTERNAL_API_URL ||
        config.env?.VITE_API_URL ||
        process.env.VITE_API_URL ||
        "http://localhost:8045/api";
      apiBaseUrl = envUrl.replace(/\/+$/, ""); // ensure no trailing slash
      console.log(
        `[og-crawler] API base URL for customer preview: ${apiBaseUrl}`
      );
    },

    configureServer(server: ViteDevServer) {
      // Add middleware BEFORE Vite's own middleware so we intercept first
      server.middlewares.use(async (req, res, next) => {
        const ua = req.headers["user-agent"];
        const url = req.url || "";

        // Only intercept crawler requests to customer view pages
        if (!isCrawler(ua)) return next();

        const match = url.match(CUSTOMER_URL_REGEX);
        if (!match) return next();

        const [, routePrefix, customerId] = match;

        // Build absolute base URL from the request so OG image/url tags are full URLs
        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers["host"] || "localhost";
        const origin = `${protocol}://${host}`;

        try {
          const preview = await fetchCustomerPreview(apiBaseUrl, customerId);

          const ogImage = `${origin}/uploads/290f5141-96dd-44f0-bc7a-9e7b5407ecb6.png`;
          const fullUrl = `${origin}${url}`;

          if (!preview.found) {
            // Customer not found — return generic OG
            const html = buildOgHtml(
              "SCIS — Customer Not Found",
              "This customer record could not be found.",
              fullUrl,
              ogImage
            );
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(html);
            return;
          }

          const fullName = [
            preview.first_name,
            preview.middle_name,
            preview.last_name,
          ]
            .filter(Boolean)
            .join(" ");

          const status = preview.status || STATUS_MAP[routePrefix] || "Client";
          const title = `SCIS — Viewing ${status} ${fullName}`;
          const description = `View details for ${status} ${fullName} on SCIS Insurance Management System.`;

          const html = buildOgHtml(
            title,
            description,
            fullUrl,
            ogImage
          );

          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
        } catch {
          // On any error, fall through to regular SPA
          next();
        }
      });
    },
  };
}
