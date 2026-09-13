import https from 'https';
import { stdin } from 'process';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_TO = process.env.EMAIL_TO;
const ALLOWED_EMAIL_TO = process.env.ALLOWED_EMAIL_TO;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY environment variable not set');
  process.exit(1);
}

if (!EMAIL_TO) {
  console.error('Error: EMAIL_TO environment variable not set');
  process.exit(1);
}

if (EMAIL_TO !== ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

const subject = process.argv[2] || 'Email Report';

// Read email body from stdin
let emailBody = '';
stdin.on('data', (chunk) => {
  emailBody += chunk.toString();
});

stdin.on('end', async () => {
  try {
    const response = await sendEmail(EMAIL_FROM, EMAIL_TO, subject, emailBody);
    console.log('Email sent successfully');
    console.log('Email ID:', response.id);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
});

function sendEmail(from, to, subject, html) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from,
      to,
      subject,
      html,
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`API error: ${jsonData.message || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });

    req.write(payload);
    req.end();
  });
}
