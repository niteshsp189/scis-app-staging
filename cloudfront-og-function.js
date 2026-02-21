/**
 * CloudFront Function: OG Meta Tags for Social Media Crawlers
 *
 * Attach this as a "Viewer Request" function on your CloudFront distribution.
 *
 * When a crawler (WhatsApp, Telegram, LinkedIn, Facebook, Twitter, etc.)
 * requests a customer page URL like /clients/view/17851, this function
 * redirects it to the backend's /share/customer/{id} endpoint which
 * returns proper OG meta tags HTML. Regular users pass through to S3/SPA.
 *
 * WhatsApp, Telegram, LinkedIn etc. all follow 302 redirects, so the
 * preview will render correctly with the customer name and type.
 *
 * ─── SETUP ───
 * 1. Go to CloudFront → Functions → Create function
 * 2. Paste this code
 * 3. Publish the function
 * 4. Associate it with your distribution's default behavior as "Viewer request"
 * 5. Replace BACKEND_ORIGIN below with your actual backend domain
 *    (the same value as VITE_API_URL but without /api — e.g. https://api.malhabal.com)
 */

var BACKEND_ORIGIN = 'https://api.malhabal.com';

// Crawler user-agent substrings (case-insensitive check via toLowerCase)
var CRAWLER_SIGNATURES = [
  'whatsapp',
  'telegrambot',
  'facebookexternalhit',
  'facebot',
  'linkedinbot',
  'twitterbot',
  'slackbot',
  'discordbot',
  'googlebot',
  'bingbot',
  'applebot',
  'pinterestbot',
];

// Customer URL pattern:  /clients/view/123  /prospects/view/456  etc.
var CUSTOMER_URL_REGEX = /^\/(clients|prospects|formers|deceaseds)\/view\/(\d+)/;

function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var uri = request.uri;

  // Get user-agent
  var ua = '';
  if (headers['user-agent'] && headers['user-agent'].value) {
    ua = headers['user-agent'].value.toLowerCase();
  }

  // Check if this is a crawler
  var isCrawler = false;
  for (var i = 0; i < CRAWLER_SIGNATURES.length; i++) {
    if (ua.indexOf(CRAWLER_SIGNATURES[i]) !== -1) {
      isCrawler = true;
      break;
    }
  }

  if (!isCrawler) {
    // Regular user — pass through to S3/SPA
    return request;
  }

  // Check if URL matches a customer page
  var match = uri.match(CUSTOMER_URL_REGEX);
  if (!match) {
    // Crawler but not a customer page — pass through
    return request;
  }

  var customerId = match[2];

  // Redirect crawler to backend share endpoint which returns OG HTML
  var redirectUrl = BACKEND_ORIGIN + '/share/customer/' + customerId;

  return {
    statusCode: 302,
    statusDescription: 'Found',
    headers: {
      'location': { value: redirectUrl },
      'cache-control': { value: 'no-cache, no-store, must-revalidate' },
    },
  };
}
