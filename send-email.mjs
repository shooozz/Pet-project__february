import https from 'https';

const subject = process.argv[2] || 'Email Report';
const emailTo = process.env.EMAIL_TO || process.env.ALLOWED_EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM;
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error('Error: RESEND_API_KEY not found');
  process.exit(1);
}

if (!emailTo) {
  console.error('Error: EMAIL_TO or ALLOWED_EMAIL_TO not found');
  process.exit(1);
}

// Read email body from stdin
let body = '';
process.stdin.setEncoding('utf-8');

process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', async () => {
  try {
    const payload = JSON.stringify({
      from: emailFrom,
      to: emailTo,
      subject: subject,
      html: `<pre>${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const response = JSON.parse(data);
          console.log('Email sent successfully');
          console.log(`Email ID: ${response.id}`);
          process.exit(0);
        } else {
          console.error(`Error: ${res.statusCode}`);
          console.error(data);
          process.exit(1);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Error sending email: ${e.message}`);
      process.exit(1);
    });

    req.write(payload);
    req.end();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});

// Handle timeout for reading stdin
setTimeout(() => {
  if (body === '') {
    console.error('Error: No input received');
    process.exit(1);
  }
}, 5000);
