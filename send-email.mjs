#!/usr/bin/env node

import https from 'https';

const apiKey = process.env.RESEND_API_KEY;
const emailTo = process.env.EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM;
const subject = process.argv[2] || 'Email';

if (!apiKey) {
  console.error('Error: RESEND_API_KEY environment variable is not set');
  process.exit(1);
}

if (!emailTo) {
  console.error('Error: EMAIL_TO environment variable is not set');
  process.exit(1);
}

let emailBody = '';

process.stdin.setEncoding('utf-8');
process.stdin.on('data', chunk => {
  emailBody += chunk;
});

process.stdin.on('end', () => {
  const payload = JSON.stringify({
    from: emailFrom,
    to: emailTo,
    subject: subject,
    html: `<pre>${emailBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
  });

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${apiKey}`,
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
          console.log(`Email ID: ${response.id}`);
        } else {
          console.error(`Error: ${response.message || 'Failed to send email'}`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });

  req.write(payload);
  req.end();
});
