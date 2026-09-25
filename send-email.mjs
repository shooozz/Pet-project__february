import https from 'https';

async function sendEmail(subject, body) {
  const emailTo = process.env.EMAIL_TO || 'islam.pucigov@mail.ru';
  const emailFrom = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';

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
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('Email sent successfully');
          console.log('Email ID:', response.id);
          resolve(response);
        } else {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
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
process.stdin.on('data', (chunk) => { body += chunk; });
process.stdin.on('end', async () => {
  try {
    const subject = process.argv[2] || 'Email';
    await sendEmail(subject, body);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
});
