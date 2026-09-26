#!/usr/bin/env node

import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_TO = process.env.EMAIL_TO;
const ALLOWED_EMAIL_TO = process.env.ALLOWED_EMAIL_TO;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY not set');
  process.exit(1);
}

if (!EMAIL_TO || !ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO or ALLOWED_EMAIL_TO not set');
  process.exit(1);
}

if (EMAIL_TO !== ALLOWED_EMAIL_TO) {
  console.error(`Error: EMAIL_TO (${EMAIL_TO}) does not match ALLOWED_EMAIL_TO (${ALLOWED_EMAIL_TO})`);
  process.exit(1);
}

const subject = process.argv[2] || 'Report';

// Read email body from stdin
let emailBody = '';

process.stdin.on('data', (chunk) => {
  emailBody += chunk.toString();
});

process.stdin.on('end', async () => {
  try {
    const response = await sendEmail(emailBody, subject);
    if (response.success) {
      console.log(`Email sent successfully to ${EMAIL_TO}`);
      console.log(`Email ID: ${response.id}`);
      process.exit(0);
    } else {
      console.error(`Failed to send email: ${response.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    process.exit(1);
  }
});

function sendEmail(body, subject) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: subject,
      text: body,
    });

    const options = {
      hostname: 'api.resend.com',
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

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, id: response.id });
          } else {
            resolve({ success: false, error: response.message || 'Unknown error' });
          }
        } catch (error) {
          resolve({ success: false, error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}
