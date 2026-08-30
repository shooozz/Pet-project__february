#!/usr/bin/env node

import { spawn } from 'child_process';

const emailTo = process.env.EMAIL_TO;
const allowedEmailTo = process.env.ALLOWED_EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';
const subject = process.argv[2] || 'Report';
const resendApiKey = process.env.RESEND_API_KEY;

// Verify email address
if (emailTo !== allowedEmailTo) {
  console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

if (!resendApiKey) {
  console.error('Error: RESEND_API_KEY is not set');
  process.exit(1);
}

// Read body from stdin
let body = '';
process.stdin.setEncoding('utf-8');

process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', async () => {
  try {
    const payload = JSON.stringify({
      from: emailFrom,
      to: emailTo,
      subject: subject,
      text: body,
    });

    const curl = spawn('curl', [
      '-X', 'POST',
      'https://api.resend.com/emails',
      '-H', 'Content-Type: application/json',
      '-H', `Authorization: Bearer ${resendApiKey}`,
      '-d', payload,
    ]);

    let response = '';
    let error = '';

    curl.stdout.on('data', data => {
      response += data.toString();
    });

    curl.stderr.on('data', data => {
      error += data.toString();
    });

    curl.on('close', code => {
      if (code !== 0) {
        console.error('Error sending email:', error);
        process.exit(1);
      }

      try {
        const result = JSON.parse(response);

        if (result.error) {
          console.error('Error:', result.error.message || result.error);
          process.exit(1);
        }

        console.log('Email sent successfully');
        console.log('Email ID:', result.id);
        process.exit(0);
      } catch (parseError) {
        console.error('Error parsing response:', response);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error sending email:', error.message);
    process.exit(1);
  }
});
