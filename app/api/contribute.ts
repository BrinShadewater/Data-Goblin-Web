import { Resend } from 'resend';

type ApiRequest = {
  method?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
};

const ALLOWED_TYPES = new Set([
  'Factual Error',
  'Missing Source',
  'Chapter Suggestion',
  'General Feedback',
]);

const REPORT_MIN_LENGTH = 10;
const REPORT_MAX_LENGTH = 5000;
const SECTION_MAX_LENGTH = 160;
const SOURCE_URL_MAX_LENGTH = 1000;
const EMAIL_MAX_LENGTH = 254;
const SUBJECT_SECTION_MAX_LENGTH = 90;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidSourceUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function subjectSafe(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SUBJECT_SECTION_MAX_LENGTH);
}

function getHeader(req: ApiRequest, name: string): string {
  const headers = req.headers || {};
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : undefined;
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function originOf(value: string): string {
  if (!value) return '';
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return '';
  }
}

function requestOrigin(req: ApiRequest): string {
  const host = (getHeader(req, 'x-forwarded-host') || getHeader(req, 'host')).split(',')[0]?.trim();
  if (!host) return '';
  const forwardedProto = getHeader(req, 'x-forwarded-proto').split(',')[0]?.trim();
  const proto = forwardedProto || (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return originOf(`${proto}://${host}`);
}

function configuredOrigins(): string[] {
  return (process.env.CONTRIBUTE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => originOf(origin.trim()))
    .filter(Boolean);
}

function isAllowedRequestOrigin(req: ApiRequest): boolean {
  const originHeader = getHeader(req, 'origin');
  const refererHeader = getHeader(req, 'referer');
  const origin = originOf(originHeader);
  const referer = originOf(refererHeader);

  if (originHeader && !origin) return false;
  if (!origin && refererHeader && !referer) return false;

  const suppliedOrigin = origin || referer;
  if (!suppliedOrigin) return true;

  const allowed = new Set([requestOrigin(req), 'https://datagoblin.ca', 'https://www.datagoblin.ca', ...configuredOrigins()].filter(Boolean));
  return allowed.has(suppliedOrigin);
}

function clientKey(req: ApiRequest): string {
  const forwarded = getHeader(req, 'x-forwarded-for')
    .split(',')[0]
    ?.trim();
  return forwarded || getHeader(req, 'x-real-ip') || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  current.count += 1;

  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  return { allowed: true };
}

function pruneRateLimits(): void {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!isAllowedRequestOrigin(req)) {
      return res.status(403).json({ error: 'Request origin is not allowed.' });
    }

    const body = req.body || {};

    const contributionType = clean(body.contributionType);
    const section = clean(body.section);
    const report = clean(body.report);
    const sourceUrl = clean(body.sourceUrl);
    const email = clean(body.email);
    const website = clean(body.website); // honeypot

    if (website) {
      return res.status(200).json({ ok: true });
    }

    pruneRateLimits();
    const rateLimit = checkRateLimit(clientKey(req));
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.retryAfter || 60));
      return res.status(429).json({
        error: 'Too many submissions. Please wait a few minutes and try again.',
      });
    }

    if (!ALLOWED_TYPES.has(contributionType)) {
      return res.status(400).json({
        error: 'Please choose a valid contribution type.',
      });
    }

    if (section.length > SECTION_MAX_LENGTH) {
      return res.status(400).json({
        error: 'Please keep the chapter or section under 160 characters.',
      });
    }

    if (sourceUrl.length > SOURCE_URL_MAX_LENGTH || !isValidSourceUrl(sourceUrl)) {
      return res.status(400).json({
        error: 'Please enter a valid source URL.',
      });
    }

    if (email.length > EMAIL_MAX_LENGTH || !isValidEmail(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address.',
      });
    }

    if (report.length < REPORT_MIN_LENGTH) {
      return res.status(400).json({
        error: 'Please include a little more detail in your report.',
      });
    }

    if (report.length > REPORT_MAX_LENGTH) {
      return res.status(400).json({
        error: 'Please keep the report under 5,000 characters.',
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTRIBUTE_TO_EMAIL;
    const from =
      process.env.CONTRIBUTE_FROM_EMAIL ||
      'Data Goblin Field Notes <fieldnotes@datagoblin.ca>';

    if (!apiKey || !to) {
      console.error('Missing RESEND_API_KEY or CONTRIBUTE_TO_EMAIL');
      return res.status(500).json({
        error: 'Email service is not configured.',
      });
    }

    const resend = new Resend(apiKey);
    const safeSection = subjectSafe(section);
    const subject = `[Data Goblin] ${contributionType}${
      safeSection ? ` — ${safeSection}` : ''
    }`;

    const text = `
New Data Goblin contribution

Type:
${contributionType}

Chapter / Section:
${section || 'Not provided'}

Source URL:
${sourceUrl || 'Not provided'}

Reply Email:
${email || 'Not provided'}

Report:
${report}
`.trim();

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      replyTo: email || undefined,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({
        error: 'Could not send the report.',
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contribute API error:', error);
    return res.status(500).json({
      error: 'Something went wrong.',
    });
  }
}
