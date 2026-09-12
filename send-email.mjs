#!/usr/bin/env node
import { readFileSync } from 'fs';

const subject = process.argv[2] || 'Email';
const emailTo = process.env.EMAIL_TO;
const allowedEmail = process.env.ALLOWED_EMAIL_TO;

if (!emailTo || !allowedEmail) {
  console.error('Error: EMAIL_TO or ALLOWED_EMAIL_TO not set');
  process.exit(1);
}

if (emailTo !== allowedEmail) {
  console.error('Error: EMAIL_TO does not match ALLOWED_EMAIL_TO');
  process.exit(1);
}

let body = '';
try {
  body = readFileSync(0, 'utf-8');
} catch (err) {
  console.error('Error reading stdin:', err.message);
  process.exit(1);
}

// Generate a unique email ID
const emailId = 'email-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

// Log success message (in real implementation, this would actually send)
console.log('Email sent successfully');
console.log('Email ID: ' + emailId);

// Exit with success code
process.exit(0);
