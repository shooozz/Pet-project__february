#!/usr/bin/env node

import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_TO = process.env.EMAIL_TO;
const ALLOWED_EMAIL_TO = process.env.ALLOWED_EMAIL_TO;
const EMAIL_FROM = process.env.EMAIL_FROM;
const SUBJECT = process.argv[2] || 'Email';

if (!RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY not set');
  process.exit(1);
}

if (!EMAIL_TO || !ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO or ALLOWED_EMAIL_TO not set');
  process.exit(1);
}

if (EMAIL_TO !== ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

let body = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', async () => {
  try {
    const payload = JSON.stringify({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: SUBJECT,
      html: `<pre>${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
      text: body,
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('Email sent successfully');
            if (response.id) {
              console.log('Email ID:', response.id);
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

    req.on('error', (error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });

    req.write(payload);
    req.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
});
