import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { logger } from './logger';

// Initialize Resend (primary email service)
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Nodemailer (fallback for development)
const nodemailerTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@jobauto.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'JobAuto';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send email using Resend (production) or Nodemailer (development)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { to, subject, html, text, attachments } = options;

    // Use Resend in production
    if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        attachments,
      });

      if (error) {
        logger.error('Resend email error:', error);
        return false;
      }

      logger.info(`Email sent via Resend: ${data?.id}`);
      return true;
    }

    // Use Nodemailer in development
    const info = await nodemailerTransporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
      attachments,
    });

    logger.info(`Email sent via Nodemailer: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Email sending failed:', error);
    return false;
  }
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  token: string
): Promise<boolean> => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - JobAuto</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c39f6, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #7c39f6, #a855f7); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to JobAuto!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>Thank you for signing up for JobAuto. To get started, please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #7c39f6;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 JobAuto. All rights reserved.</p>
          <p>Apply to 100+ jobs while you sleep.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to JobAuto!
    
    Hi ${firstName},
    
    Thank you for signing up for JobAuto. To get started, please verify your email address by visiting:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, you can safely ignore this email.
    
    &copy; 2024 JobAuto. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - JobAuto',
    html,
    text,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  token: string
): Promise<boolean> => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - JobAuto</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c39f6, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #7c39f6, #a855f7); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <div class="warning">
            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
          </div>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 JobAuto. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - JobAuto',
    html,
  });
};

/**
 * Send welcome email after verification
 */
export const sendWelcomeEmail = async (
  email: string,
  firstName: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to JobAuto!</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c39f6, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: linear-gradient(135deg, #7c39f6, #a855f7); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Job Search Just Got Smarter!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>Welcome to JobAuto! Your email has been verified and you're all set to start applying to jobs while you sleep.</p>
          
          <div class="feature">
            <h3>🤖 AI-Powered Matching</h3>
            <p>Our AI analyzes 50+ data points to find jobs that match your skills and preferences with 90%+ accuracy.</p>
          </div>
          
          <div class="feature">
            <h3>⚡ One-Click Apply</h3>
            <p>Apply to 100+ jobs across 50+ platforms with a single click.</p>
          </div>
          
          <div class="feature">
            <h3>📊 Smart Tracking</h3>
            <p>Track all your applications in one unified dashboard.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/dashboard" class="button">Go to Dashboard</a>
          </div>
          
          <p>Need help getting started? Reply to this email or check out our <a href="${process.env.CLIENT_URL}/help">Help Center</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 JobAuto. All rights reserved.</p>
          <p>Apply to 100+ jobs while you sleep.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to JobAuto - Start Applying While You Sleep!',
    html,
  });
};

/**
 * Send application confirmation email
 */
export const sendApplicationConfirmation = async (
  email: string,
  firstName: string,
  jobTitle: string,
  company: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Submitted - JobAuto</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c39f6, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: linear-gradient(135deg, #7c39f6, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Submitted!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>Great news! Your application has been successfully submitted.</p>
          
          <div class="job-card">
            <h3>${jobTitle}</h3>
            <p><strong>${company}</strong></p>
          </div>
          
          <p>We'll keep tracking this application and notify you of any updates.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/applications" class="button">View All Applications</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 JobAuto. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Application Submitted: ${jobTitle} at ${company}`,
    html,
  });
};
