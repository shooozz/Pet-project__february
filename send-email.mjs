import https from 'https';

async function sendEmail(subject, htmlBody) {
  const emailTo = process.env.EMAIL_TO || 'islam.pucigov@mail.ru';
  const allowedEmail = process.env.ALLOWED_EMAIL_TO || 'islam.pucigov@mail.ru';

  // Security check - verify email is in allowed list
  if (emailTo !== allowedEmail) {
    console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
    process.exit(1);
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('Error: RESEND_API_KEY environment variable not set');
    process.exit(1);
  }

  const emailFrom = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';

  const payload = JSON.stringify({
    from: emailFrom,
    to: emailTo,
    subject: subject,
    html: `<pre style="font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(htmlBody)}</pre>`
  });

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            console.log('Email sent successfully');
            console.log('Email ID:', result.id);
            resolve(result);
          } catch (e) {
            console.error('Failed to parse response:', data);
            reject(e);
          }
        } else {
          console.error(`Error: HTTP ${res.statusCode}`);
          console.error(data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

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

// Read email body from stdin
let emailBody = '';
process.stdin.on('data', chunk => {
  emailBody += chunk.toString();
});

process.stdin.on('end', async () => {
  const subject = process.argv[2] || 'Email Report';
  try {
    await sendEmail(subject, emailBody);
  } catch (error) {
    console.error('Failed to send email:', error.message);
    process.exit(1);
  }
});
