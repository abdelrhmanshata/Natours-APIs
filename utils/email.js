const nodemailer = require('nodemailer');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email; // The recipient's email address
    this.firstName = user.name.split(' ')[0]; // The first name of the user
    this.url = url; // A URL that will be included in the email
    this.from = `AbdElrhman <${process.env.EMAIL_FROM}>`; // The sender's email address, customized with the user's name
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // If in production, use SendGrid to send the emails
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME, // SendGrid username from environment variables
          pass: process.env.SENDGRID_PASSWORD, // SendGrid password from environment variables
        },
      });
    }

    // If not in production (i.e., in development), use a different email transport (e.g., SMTP)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // Email host from environment variables
      port: process.env.EMAIL_PORT, // Email port from environment variables
      auth: {
        user: process.env.EMAIL_USERNAME, // Email username from environment variables
        pass: process.env.EMAIL_PASSWORD, // Email password from environment variables
      },
    });
  }

  // Method to send an email with specified subject and message
  async send(subject, message) {
    // 1) Define the email options
    const mailOptions = {
      from: this.from, // Sender's email address
      to: this.to, // Recipient's email address
      subject, // Subject of the email
      text: message, // Plain text body of the email
    };

    // 2) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  // Method to send a welcome email to the user
  async sendWelcome() {
    await this.send(
      'Welcome to the Natours Family!',
      `Welcome to Natours, we're glad to have you 🎉🙏 \nWe're all a big family here, so make sure to upload your user photo so we get to know you a bit better! Click here to see your profile: ${this.url}`,
    );
  }

  // Method to send a password reset email to the user
  async sendPasswordReset() {
    await this.send(
      'Your password reset token (valid for only 10 minutes)',
      `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${this.url}.\nIf you didn't forget your password, please ignore this email!`,
    );
  }
};
