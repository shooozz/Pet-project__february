#!/usr/bin/env node

import https from 'https';

const apiKey = process.env.RESEND_API_KEY;
const emailTo = process.env.EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM;

if (!apiKey) {
  console.error('Error: RESEND_API_KEY environment variable not set');
  process.exit(1);
}

if (!emailTo) {
  console.error('Error: EMAIL_TO environment variable not set');
  process.exit(1);
}

if (!emailFrom) {
  console.error('Error: EMAIL_FROM environment variable not set');
  process.exit(1);
}

const subject = process.argv[2] || 'Email from Claude Reports';

// Read email body from stdin
let body = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', () => {
  sendEmail(subject, body);
});

function sendEmail(subject, body) {
  const payload = JSON.stringify({
    from: emailFrom,
    to: emailTo,
    subject: subject,
    html: body.replace(/\n/g, '<br>')
  });

  const options = {
    hostname: 'api.resend.com',
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsedResponse = JSON.parse(responseData);
        if (res.statusCode === 200) {
          console.log('Email sent successfully');
          if (parsedResponse.id) {
            console.log('Email ID:', parsedResponse.id);
          }
        } else {
          console.error('Error sending email:', parsedResponse.message || responseData);
          process.exit(1);
        }
      } catch (e) {
        console.error('Error parsing response:', responseData);
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
}
