import * as readline from 'readline';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';
const EMAIL_TO = process.env.EMAIL_TO;
const ALLOWED_EMAIL_TO = process.env.ALLOWED_EMAIL_TO;

if (!RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY is not set');
  process.exit(1);
}

if (!EMAIL_TO) {
  console.error('Error: EMAIL_TO is not set');
  process.exit(1);
}

if (EMAIL_TO !== ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

const subject = process.argv[2] || 'Report';

// Read email body from stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let body = '';

rl.on('line', (line) => {
  body += line + '\n';
});

rl.on('close', async () => {
  body = body.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: EMAIL_TO,
        subject: subject,
        html: `<pre>${body}</pre>`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Error sending email: ${data.message || response.statusText}`);
      process.exit(1);
    }

    console.log('Email sent successfully');
    console.log(`Email ID: ${data.id}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});
