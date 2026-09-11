#!/usr/bin/env node
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail() {
  const subject = process.argv[2] || 'Email from Claude Reports';
  const emailTo = process.env.EMAIL_TO || process.env.ALLOWED_EMAIL_TO;
  const emailFrom = process.env.EMAIL_FROM || 'Claude Reports <onboarding@resend.dev>';

  // Validate email addresses
  if (!emailTo) {
    console.error('Error: EMAIL_TO or ALLOWED_EMAIL_TO environment variable not set');
    process.exit(1);
  }

  if (emailTo !== process.env.ALLOWED_EMAIL_TO) {
    console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
    process.exit(1);
  }

  // Read body from stdin
  let body = '';

  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    body += chunk;
  }

  if (!body) {
    console.error('Error: No email body provided via stdin');
    process.exit(1);
  }

  try {
    const response = await resend.emails.send({
      from: emailFrom,
      to: emailTo,
      subject: subject,
      html: body,
    });

    if (response.error) {
      console.error('Error sending email:', response.error);
      process.exit(1);
    }

    console.log('Email sent successfully');
    console.log('Email ID:', response.data.id);
    process.exit(0);
  } catch (error) {
    console.error('Error sending email:', error.message);
    process.exit(1);
  }
}

sendEmail();
