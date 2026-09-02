#!/usr/bin/env node

import https from 'https';

const subject = process.argv[2];
if (!subject) {
  console.error('Usage: node send-email.mjs "<subject>"');
  console.error('Email body should be provided via stdin');
  process.exit(1);
}

const emailTo = process.env.EMAIL_TO;
const allowedEmailTo = process.env.ALLOWED_EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM;
const resendApiKey = process.env.RESEND_API_KEY;

if (!emailTo || !allowedEmailTo || !emailFrom || !resendApiKey) {
  console.error('Error: Missing required environment variables');
  console.error('Required: EMAIL_TO, ALLOWED_EMAIL_TO, EMAIL_FROM, RESEND_API_KEY');
  process.exit(1);
}

if (emailTo !== allowedEmailTo) {
  console.error(`Error: EMAIL_TO (${emailTo}) does not match ALLOWED_EMAIL_TO (${allowedEmailTo})`);
  process.exit(1);
}

let bodyText = '';

process.stdin.setEncoding('utf-8');
process.stdin.on('data', chunk => {
  bodyText += chunk;
});

process.stdin.on('end', async () => {
  try {
    const payload = JSON.stringify({
      from: emailFrom,
      to: emailTo,
      subject: subject,
      html: `<pre>${bodyText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
      text: bodyText
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${resendApiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const parsed = JSON.parse(responseData);
            console.log('Email sent successfully');
            console.log(`Email ID: ${parsed.id}`);
            process.exit(0);
          } catch (e) {
            console.log('Email sent successfully');
            console.log(`Response: ${responseData}`);
            process.exit(0);
          }
        } else {
          console.error(`Error: HTTP ${res.statusCode}`);
          console.error(responseData);
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
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});
