#!/usr/bin/env node

import { Resend } from 'resend';

const subject = process.argv[2] || 'Email Report';
const apiKey = process.env.RESEND_API_KEY;
const emailTo = process.env.EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM;
const allowedEmailTo = process.env.ALLOWED_EMAIL_TO;

// Verify configuration
if (!apiKey) {
  console.error('Error: RESEND_API_KEY not found in environment variables');
  process.exit(1);
}

if (!emailTo) {
  console.error('Error: EMAIL_TO not found in environment variables');
  process.exit(1);
}

if (!allowedEmailTo) {
  console.error('Error: ALLOWED_EMAIL_TO not found in environment variables');
  process.exit(1);
}

// Validate email recipient
if (emailTo !== allowedEmailTo) {
  console.error(`Error: EMAIL_TO (${emailTo}) does not match ALLOWED_EMAIL_TO (${allowedEmailTo})`);
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
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: emailFrom,
      to: emailTo,
      subject: subject,
      html: `<pre>${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
      text: body,
    });

    if (result.error) {
      console.error(`Error sending email: ${result.error.message}`);
      process.exit(1);
    }

    console.log(`Email sent successfully`);
    console.log(`Email ID: ${result.data.id}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});

// Handle timeout
setTimeout(() => {
  console.error('Error: timeout reading from stdin');
  process.exit(1);
}, 30000);
