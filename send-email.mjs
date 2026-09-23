#!/usr/bin/env node

import https from 'https';

const emailTo = process.env.EMAIL_TO || 'islam.pucigov@mail.ru';
const allowedEmailTo = process.env.ALLOWED_EMAIL_TO || 'islam.pucigov@mail.ru';
const emailFrom = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';
const apiKey = process.env.RESEND_API_KEY;

// Validate recipient
if (emailTo !== allowedEmailTo) {
  console.error(`Error: EMAIL_TO (${emailTo}) does not match ALLOWED_EMAIL_TO (${allowedEmailTo})`);
  process.exit(1);
}

if (!apiKey) {
  console.error('Error: RESEND_API_KEY environment variable not set');
  process.exit(1);
}

// Read email body from stdin
let emailBody = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  emailBody += chunk;
});

process.stdin.on('end', () => {
  try {
    const subject = process.argv[2] || 'Report';

    const requestBody = JSON.stringify({
      from: emailFrom,
      to: emailTo,
      subject: subject,
      text: emailBody,
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        'Authorization': `Bearer ${apiKey}`,
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

          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('Email sent successfully');
            if (response.id) {
              console.log(`Email ID: ${response.id}`);
            }
          } else {
            console.error(`Error sending email: ${response.message || data}`);
            process.exit(1);
          }
        } catch (e) {
          console.error(`Error parsing response: ${e.message}`);
          process.exit(1);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });

    req.write(requestBody);
    req.end();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});
