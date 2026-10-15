import https from 'https';
import process from 'process';

const subject = process.argv[2] || 'Default Subject';
const emailTo = process.env.EMAIL_TO;

if (!emailTo) {
  console.error('Missing EMAIL_TO environment variable');
  process.exit(1);
}

let body = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', async () => {
  try {
    // Try to use Gmail API via direct HTTP request
    // This would require a valid OAuth token in GMAIL_ACCESS_TOKEN
    const accessToken = process.env.GMAIL_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('GMAIL_ACCESS_TOKEN not set. Try setting RESEND_API_KEY or providing Gmail OAuth token.');
    }
    
    const message = `From: ${emailTo}\nTo: ${emailTo}\nSubject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${body}`;
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const options = {
      hostname: 'www.googleapis.com',
      path: '/gmail/v1/users/me/messages/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const result = JSON.parse(data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Email sent successfully');
          console.log(`Email ID: ${result.id}`);
          process.exit(0);
        } else {
          console.error('Email sending failed:', result.error?.message || result.message);
          process.exit(1);
        }
      });
    });
    
    req.on('error', error => {
      console.error('Email sending failed:', error.message);
      process.exit(1);
    });
    
    req.write(JSON.stringify({ raw: encodedMessage }));
    req.end();
  } catch (error) {
    console.error('Email sending failed:', error.message);
    process.exit(1);
  }
});
