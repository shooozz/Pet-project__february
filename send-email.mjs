#!/usr/bin/env node

import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_TO = process.env.EMAIL_TO;
const ALLOWED_EMAIL_TO = process.env.ALLOWED_EMAIL_TO;

const subject = process.argv[2] || 'Email Report';

if (!RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY environment variable is not set');
  process.exit(1);
}

if (!EMAIL_TO || !ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO or ALLOWED_EMAIL_TO environment variables are not set');
  process.exit(1);
}

if (EMAIL_TO !== ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

// Read email body from stdin
let emailBody = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  emailBody += chunk;
});

process.stdin.on('end', () => {
  const requestData = JSON.stringify({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: subject,
    html: `<pre>${emailBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
    text: emailBody
  });

  const options = {
    hostname: 'api.resend.com',
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestData)
    }
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
        console.error('Error parsing response:', e.message);
        console.error('Response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
    process.exit(1);
  });

  req.write(requestData);
  req.end();
});
