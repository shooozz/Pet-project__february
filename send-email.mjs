import https from 'https';

async function sendEmail(subject, body) {
  const to = process.env.EMAIL_TO || 'islam.pucigov@mail.ru';
  const from = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';
  const allowedEmail = process.env.ALLOWED_EMAIL_TO || 'islam.pucigov@mail.ru';

  // Safety check
  if (to !== allowedEmail) {
    throw new Error(`Email address mismatch: ${to} !== ${allowedEmail}`);
  }

  const payload = JSON.stringify({
    from: from,
    to: to,
    subject: subject,
    html: `<pre>${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
    text: body
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY || 'test_key_placeholder'}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const response = JSON.parse(data);
          if (response.id) {
            console.log('Email sent successfully');
            console.log(`Email ID: ${response.id}`);
            resolve(response);
          } else {
            reject(new Error(`Failed to send email: ${data}`));
          }
        } else {
          reject(new Error(`API Error (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Read email body from stdin
let body = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => body += chunk);
process.stdin.on('end', async () => {
  try {
    const subject = process.argv[2] || 'Email Report';
    await sendEmail(subject, body);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
});
