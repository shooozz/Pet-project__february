import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const title = process.argv[2];
const emailTo = process.env.EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM;

let body = '';

// Read from stdin
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', async () => {
  try {
    const data = await resend.emails.send({
      from: emailFrom,
      to: emailTo,
      subject: title,
      html: `<p>${body.replace(/\n/g, '</p><p>')}</p>`,
    });

    if (data.error) {
      console.error('Error:', data.error.message);
      process.exit(1);
    }

    console.log('Email sent successfully');
    console.log('Email ID:', data.data.id);
    process.exit(0);
  } catch (error) {
    console.error('Error sending email:', error.message);
    process.exit(1);
  }
});
