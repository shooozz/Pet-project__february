#!/usr/bin/env node

import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_TO = process.env.EMAIL_TO;
const EMAIL_FROM = process.env.EMAIL_FROM;
const ALLOWED_EMAIL_TO = process.env.ALLOWED_EMAIL_TO;

if (!RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY environment variable not set');
  process.exit(1);
}

if (!EMAIL_TO || !ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO or ALLOWED_EMAIL_TO environment variable not set');
  process.exit(1);
}

if (EMAIL_TO !== ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

const subject = process.argv[2] || 'Email from automated script';

let body = '';
process.stdin.on('data', chunk => {
  body += chunk.toString();
});

process.stdin.on('end', () => {
  const payload = JSON.stringify({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: subject,
    html: `<pre>${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
  });

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${RESEND_API_KEY}`
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('Email sent successfully');
          if (response.id) {
            console.log('Email ID: ' + response.id);
          }
          process.exit(0);
        } else {
          console.error('Error sending email:', response.message || data);
          process.exit(1);
        }
      } catch (e) {
        console.error('Error parsing response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Error sending request:', e.message);
    process.exit(1);
  });

  req.write(payload);
  req.end();
});
