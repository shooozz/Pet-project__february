#!/usr/bin/env node

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const subject = process.argv[2] || 'Email Report';
const emailTo = process.env.EMAIL_TO;
const allowedEmailTo = process.env.ALLOWED_EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// Verify email addresses match
if (emailTo !== allowedEmailTo) {
  console.error('Error: EMAIL_TO and ALLOWED_EMAIL_TO do not match');
  process.exit(1);
}

// Read email body from stdin
let body = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  body += chunk;
});

process.stdin.on('end', async () => {
  try {
    const result = await resend.emails.send({
      from: emailFrom,
      to: emailTo,
      subject: subject,
      html: `<pre style="font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
    });

    if (result.error) {
      console.error('Error sending email:', result.error);
      process.exit(1);
    }

    console.log('Email sent successfully');
    console.log('Email ID:', result.data.id);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
});
