#!/usr/bin/env node

import { stdin } from 'process';

const EMAIL_TO = process.env.EMAIL_TO;
const ALLOWED_EMAIL_TO = process.env.ALLOWED_EMAIL_TO;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!EMAIL_TO || EMAIL_TO !== ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO is not set or does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

if (!EMAIL_FROM) {
  console.error('Error: EMAIL_FROM is not set');
  process.exit(1);
}

const subject = process.argv[2] || 'Email from Claude Reports';

let emailBody = '';

stdin.on('data', (chunk) => {
  emailBody += chunk.toString();
});

stdin.on('end', async () => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: EMAIL_TO,
        subject: subject,
        html: emailBody.replace(/\n/g, '<br>'),
        text: emailBody,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error sending email:', error);
      process.exit(1);
    }

    const result = await response.json();
    console.log('Email sent successfully');
    if (result.id) {
      console.log('Email ID:', result.id);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
});
