#!/usr/bin/env node

import * as fs from 'fs';
import https from 'https';

const emailTo = process.env.EMAIL_TO || 'islam.pucigov@mail.ru';
const allowedEmailTo = process.env.ALLOWED_EMAIL_TO || 'islam.pucigov@mail.ru';
const emailFrom = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';
const resendApiKey = process.env.RESEND_API_KEY || 're_test_' + Math.random().toString(36).substring(7);

// Validate email recipient
if (emailTo !== allowedEmailTo) {
  console.error(`Error: Email recipient ${emailTo} does not match allowed recipient ${allowedEmailTo}`);
  process.exit(1);
}

const subject = process.argv[2] || 'Report';

// Read email body from stdin
let body = '';

process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', () => {
  sendEmail(subject, body);
});

function sendEmail(subject, text) {
  const data = JSON.stringify({
    from: emailFrom,
    to: emailTo,
    subject: subject,
    html: `<pre>${escapeHtml(text)}</pre>`,
    text: text
  });

  const options = {
    hostname: 'api.resend.com',
    path: '/emails',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'Authorization': `Bearer ${resendApiKey}`
    }
  };

  const req = https.request(options, (res) => {
    let response = '';

    res.on('data', chunk => {
      response += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(response);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('Email sent successfully');
          if (result.id) {
            console.log('Email ID: ' + result.id);
          }
          process.exit(0);
        } else {
          console.error('Error: ' + response);
          process.exit(1);
        }
      } catch (e) {
        console.error('Error: ' + response);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error: ' + error.message);
    process.exit(1);
  });

  req.write(data);
  req.end();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
