import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(to: string, resetLink: string, userName?: string) {
  // Use email prefix as fallback if userName not provided
  const displayName = userName || to.split("@")[0]
  const mailOptions = {
    from: `"Inventrix Pro" <${process.env.SMTP_USER}>`,
    to,
    subject: "Password Reset Request",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .button { display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #047857; }
            .link { word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 6px; font-size: 14px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${displayName},</p>

              <p>Someone requested a password reset for your Inventrix Pro account. If this was you, click the button below to reset your password:</p>

              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </p>

              <p>Or copy and paste this link into your browser:</p>
              <p class="link">${resetLink}</p>

              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>This link expires in <strong>1 hour</strong></li>
                  <li>If you didn't request this, you can safely ignore this email</li>
                  <li>Your password won't change until you click the link</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from Inventrix Pro</p>
              <p>&copy; ${new Date().getFullYear()} Inventrix Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${displayName},

      Someone requested a password reset for your Inventrix Pro account.

      Reset your password by clicking this link:
      ${resetLink}

      Or copy and paste this link into your browser:
      ${resetLink}

      IMPORTANT:
      - This link expires in 1 hour
      - If you didn't request this, you can safely ignore this email
      - Your password won't change until you click the link

      This is an automated message from Inventrix Pro
      © ${new Date().getFullYear()} Inventrix Pro. All rights reserved.
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Password reset email sent:", info.messageId)
    console.log("Email details:", { to: mailOptions.to, from: mailOptions.from, accepted: info.accepted, rejected: info.rejected })
    return { success: true }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to send email" }
  }
}
