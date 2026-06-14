import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_TYPES = new Set([
  'Factual Error',
  'Missing Source',
  'Chapter Suggestion',
  'General Feedback',
]);

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
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

    if (!ALLOWED_TYPES.has(contributionType)) {
      return res.status(400).json({
        error: 'Please choose a valid contribution type.',
      });
    }

    if (report.length < 10) {
      return res.status(400).json({
        error: 'Please include a little more detail in your report.',
      });
    }

    if (report.length > 5000) {
      return res.status(400).json({
        error: 'Please keep the report under 5,000 characters.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address.',
      });
    }

    const to = process.env.CONTRIBUTE_TO_EMAIL;
    const from =
      process.env.CONTRIBUTE_FROM_EMAIL ||
      'Data Goblin Field Notes <fieldnotes@datagoblin.ca>';

    if (!process.env.RESEND_API_KEY || !to) {
      console.error('Missing RESEND_API_KEY or CONTRIBUTE_TO_EMAIL');
      return res.status(500).json({
        error: 'Email service is not configured.',
      });
    }

    const subject = `[Data Goblin] ${contributionType}${
      section ? ` — ${section}` : ''
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
