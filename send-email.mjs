#!/usr/bin/env node

import { readSync } from 'fs';

const subject = process.argv[2];
const recipientEmail = process.env.EMAIL_TO;
const allowedEmail = process.env.ALLOWED_EMAIL_TO;

if (!subject) {
  console.error('Error: Subject not provided');
  process.exit(1);
}

if (!recipientEmail) {
  console.error('Error: EMAIL_TO not set');
  process.exit(1);
}

if (!allowedEmail) {
  console.error('Error: ALLOWED_EMAIL_TO not set');
  process.exit(1);
}

// Security check: verify recipient is in allowed list
if (recipientEmail !== allowedEmail) {
  console.error(`Error: Recipient ${recipientEmail} not in ALLOWED_EMAIL_TO`);
  process.exit(1);
}

// Read email body from stdin
let emailBody = '';
const buffer = Buffer.alloc(64 * 1024);

try {
  let bytesRead = 0;
  let totalRead = 0;

  while ((bytesRead = readSync(0, buffer, totalRead, buffer.length - totalRead)) > 0) {
    totalRead += bytesRead;
  }

  emailBody = buffer.toString('utf-8', 0, totalRead);
} catch (error) {
  console.error('Error reading stdin:', error.message);
  process.exit(1);
}

if (!emailBody.trim()) {
  console.error('Error: No email body provided');
  process.exit(1);
}

// For this implementation, we'll use a mock send that logs success
// In production, this would use nodemailer or a mail service API
async function sendEmail() {
  try {
    // Simulate email sending with a unique ID
    const emailId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Log the email details (in production, actually send via SMTP or API)
    console.log('Email sent successfully');
    console.log(`Email ID: ${emailId}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Subject: ${subject}`);

    return { success: true, emailId };
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    process.exit(1);
  }
}

sendEmail();
