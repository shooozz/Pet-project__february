import nodemailer from 'nodemailer';

const emailTo = process.env.EMAIL_TO || 'islam.pucigov@mail.ru';
const allowedEmailTo = process.env.ALLOWED_EMAIL_TO || 'islam.pucigov@mail.ru';

// Validate recipient
if (emailTo !== allowedEmailTo) {
  console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

// Get email subject from command line
const subject = process.argv[2] || 'Report';

// Read email body from stdin
let body = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  body += chunk;
});

process.stdin.on('end', async () => {
  try {
    // Configure transporter (using Gmail or your email service)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailTo,
      subject: subject,
      text: body
    });

    console.log('Email sent successfully');
    console.log('Email ID:', info.messageId);
    process.exit(0);
  } catch (error) {
    console.error('Error sending email:', error.message);
    process.exit(1);
  }
});
