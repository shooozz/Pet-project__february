import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_TO = process.env.EMAIL_TO;
const EMAIL_FROM = process.env.EMAIL_FROM;
const ALLOWED_EMAIL_TO = process.env.ALLOWED_EMAIL_TO;

const subject = process.argv[2];

if (!RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY environment variable is not set');
  process.exit(1);
}

if (!EMAIL_TO || !ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO or ALLOWED_EMAIL_TO environment variable is not set');
  process.exit(1);
}

if (EMAIL_TO !== ALLOWED_EMAIL_TO) {
  console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

if (!subject) {
  console.error('Error: Subject is required as first argument');
  process.exit(1);
}

let emailBody = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  emailBody += chunk;
});

process.stdin.on('end', async () => {
  const payload = JSON.stringify({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: subject,
    html: `<pre>${escapeHtml(emailBody)}</pre>`,
    text: emailBody,
  });

  const options = {
    hostname: 'api.resend.com',
    port: 443,
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

    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (res.statusCode === 200 && response.id) {
          console.log('Email sent successfully');
          console.log('Email ID: ' + response.id);
          process.exit(0);
        } else {
          console.error('Failed to send email');
          console.error(data);
          process.exit(1);
        }
      } catch (e) {
        console.error('Error parsing response:', e.message);
        console.error('Response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  });

  req.write(payload);
  req.end();
});

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
