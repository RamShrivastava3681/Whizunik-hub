# 📧 Email Verification Setup Guide

Your email verification system is not working because the email configuration is missing. Follow these steps to set it up:

## 🚀 Quick Setup Options

### Option 1: Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Update your .env file**:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### Option 2: Outlook/Hotmail Setup

1. **Update your .env file**:
   ```
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASS=your-password
   ```

### Option 3: Professional Email Service (Production)

For production, consider using:
- **SendGrid**: `EMAIL_HOST=smtp.sendgrid.net`
- **Mailgun**: `EMAIL_HOST=smtp.mailgun.org`
- **AWS SES**: `EMAIL_HOST=email-smtp.region.amazonaws.com`

## 🔧 Current Status

Your `.env` file now has placeholder email settings. You need to:

1. **Replace placeholders** with real email credentials
2. **Restart your server** after making changes
3. **Test the email verification** process

## 🧪 Testing Steps

1. Update `.env` with real email credentials
2. Restart server: `npm run dev`
3. Try registering a new user
4. Check your email inbox (and spam folder)

## 🔍 Troubleshooting

If emails still don't work:

1. **Check server console** for email errors
2. **Verify email credentials** are correct
3. **Check spam/junk folder**
4. **Try different email service** (Gmail vs Outlook)
5. **Enable "Less secure app access"** (Gmail legacy accounts)

## 🛡️ Security Notes

- Never commit real email passwords to Git
- Use App Passwords instead of main account passwords
- Consider using environment-specific .env files
- For production, use professional email services

## 📞 Quick Test Command

After setup, you can test email sending with this server endpoint:
```
POST http://localhost:5000/api/auth/register
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123",
  "role": "salesman"
}
```