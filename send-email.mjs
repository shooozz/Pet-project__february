import nodeMailer from 'nodemailer';

// Get email configuration from environment
const emailTo = process.env.EMAIL_TO;
const allowedEmailTo = process.env.ALLOWED_EMAIL_TO;
const emailFrom = process.env.EMAIL_FROM;

// Validate that recipient is allowed
if (emailTo !== allowedEmailTo) {
  console.error(`Error: EMAIL_TO (${emailTo}) does not match ALLOWED_EMAIL_TO (${allowedEmailTo})`);
  process.exit(1);
}

const subject = process.argv[2] || 'Email Report';

// Read email body from stdin
let emailBody = '';
process.stdin.setEncoding('utf-8');

process.stdin.on('data', (chunk) => {
  emailBody += chunk;
});

process.stdin.on('end', async () => {
  try {
    // Create transporter using Resend API
    const transporter = nodeMailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY || ''
      }
    });

    // Send email
    const result = await transporter.sendMail({
      from: emailFrom,
      to: emailTo,
      subject: subject,
      text: emailBody,
      html: `<pre>${emailBody.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
    });

    console.log('Email sent successfully');
    console.log(`Email ID: ${result.messageId}`);
    process.exit(0);
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
    process.exit(1);
  }
});
