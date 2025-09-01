const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
   
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}&email=${email}`;
    
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'ZettaNews'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h2 style="color: #333; margin: 0;">Password Reset Request</h2>
          </div>
          
          <div style="padding: 20px; background-color: #ffffff;">
            <p>Hello ${userName},</p>
            
            <p>You have requested to reset your password. Click the button below to proceed:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request this password reset, please ignore this email.</p>
            
            <p>Best regards,<br>The ZettaNews Team</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 12px;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hello ${userName},
        
        You have requested to reset your password. Please visit the following link:
        
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        The ZettaNews Team
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  // Send welcome email after registration
  async sendWelcomeEmail(email, userName) {
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'ZettaNews'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to ZettaNews!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h2 style="color: #333; margin: 0;">Welcome to ZettaNews!</h2>
          </div>
          
          <div style="padding: 20px; background-color: #ffffff;">
            <p>Hello ${userName},</p>
            
            <p>Thank you for registering with ZettaNews! Your account has been created successfully.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Browse and read news articles</li>
              <li>Comment on articles</li>
              <li>Save your favorite articles</li>
              <li>Receive personalized news updates</li>
            </ul>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>The ZettaNews Team</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 12px;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
