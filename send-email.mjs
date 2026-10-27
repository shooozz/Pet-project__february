#!/usr/bin/env node

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';
const EMAIL_TO = process.env.EMAIL_TO;
const ALLOWED_EMAIL_TO = process.env.ALLOWED_EMAIL_TO;

if (!RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY environment variable is not set');
  process.exit(1);
}

if (!EMAIL_TO) {
  console.error('Error: EMAIL_TO environment variable is not set');
  process.exit(1);
}

if (EMAIL_TO !== ALLOWED_EMAIL_TO) {
  console.error(`Error: EMAIL_TO (${EMAIL_TO}) does not match ALLOWED_EMAIL_TO (${ALLOWED_EMAIL_TO})`);
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

const subject = process.argv[2] || 'Email Report';

// Read email body from stdin
let body = '';

process.stdin.setEncoding('utf-8');
process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', async () => {
  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: subject,
      text: body,
    });

    if (response.error) {
      console.error(`Error sending email: ${response.error.message}`);
      process.exit(1);
    }

    console.log('Email sent successfully');
    console.log(`Email ID: ${response.data.id}`);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    process.exit(1);
  }
});
