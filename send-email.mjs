import process from 'process';

const subject = process.argv[2] || 'Default Subject';
const apiKey = process.env.RESEND_API_KEY;
const emailTo = process.env.EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';

if (!apiKey || !emailTo) {
  console.error('Missing required environment variables: RESEND_API_KEY or EMAIL_TO');
  process.exit(1);
}

let body = '';

// Read from stdin
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', async () => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: emailFrom,
        to: emailTo,
        subject: subject,
        html: `<pre>${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
        text: body
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Email sending failed:', data.message || response.statusText);
      process.exit(1);
    }

    console.log('Email sent successfully');
    console.log(`Email ID: ${data.id}`);
    process.exit(0);
  } catch (error) {
    console.error('Email sending failed:', error.message);
    process.exit(1);
  }
});
