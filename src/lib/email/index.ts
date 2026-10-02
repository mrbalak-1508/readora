import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  adminAlertEmail?: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: SmtpConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  fromEmail: process.env.SMTP_FROM_EMAIL || "library@readora.library",
  fromName: process.env.SMTP_FROM_NAME || "READORA Digital Library",
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL || "admin@readora.library",
  enabled: true,
};

/**
 * Retrieves the active SMTP settings from database or defaults
 */
export async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "smtp_settings" },
    });

    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
    }
  } catch (err) {
    console.error("Error reading SMTP settings from database:", err);
  }

  return DEFAULT_CONFIG;
}

/**
 * Saves SMTP configuration to database
 */
export async function saveSmtpConfig(config: Partial<SmtpConfig>): Promise<SmtpConfig> {
  const current = await getSmtpConfig();
  const merged: SmtpConfig = {
    ...current,
    ...config,
  };

  await prisma.siteSetting.upsert({
    where: { key: "smtp_settings" },
    update: {
      value: JSON.stringify(merged),
      description: "email_smtp",
    },
    create: {
      key: "smtp_settings",
      value: JSON.stringify(merged),
      description: "email_smtp",
    },
  });

  return merged;
}

/**
 * Creates a reusable Nodemailer transporter
 */
async function createTransporter() {
  const config = await getSmtpConfig();

  if (!config.user || !config.pass) {
    // Return null if credentials are empty to allow simulated fallback
    return { transporter: null, config };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return { transporter, config };
}

/**
 * Generic Mail Sender
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  try {
    const { transporter, config } = await createTransporter();

    if (!transporter) {
      console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
      return {
        success: true,
        simulated: true,
        messageId: `simulated-${Date.now()}`,
      };
    }

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      text: text || subject,
      html,
    });

    console.log(`[EMAIL SENT] ID: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("[EMAIL ERROR]", err);
    return { success: false, error: err?.message || "Failed to deliver email" };
  }
}

/**
 * Standard Email Layout Wrapper with READORA Brand Aesthetics
 */
function wrapBrandEmailTemplate(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAF7F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1C22; }
    .container { max-width: 600px; margin: 30px auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #EAE3D2; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #5A3E85 0%, #442D68 100%); padding: 36px 30px; text-align: center; color: #FFFFFF; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; }
    .header p { margin: 6px 0 0 0; opacity: 0.85; font-size: 13px; letter-spacing: 1px; }
    .content { padding: 36px 32px; font-size: 15px; line-height: 1.65; color: #2C261E; }
    .btn { display: inline-block; padding: 14px 28px; background-color: #5A3E85; color: #FFFFFF !important; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px; margin-top: 20px; box-shadow: 0 4px 12px rgba(90, 62, 133, 0.3); }
    .footer { background-color: #F8F5EE; padding: 24px 30px; text-align: center; font-size: 12px; color: #7A7265; border-top: 1px solid #EFEAE0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>READORA</h1>
      <p>PREMIUM DIGITAL LIBRARY &amp; EBOOK SANCTUARY</p>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} READORA Digital Library. All rights reserved.</p>
      <p>Read. Discover. Belong. • A beautiful home for the books you love.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 1. Order Confirmation & Book Unlocked Email
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  bookTitle: string;
  bookAuthor: string;
  amount: number;
  readUrl: string;
}) {
  const body = `
    <h2 style="color: #5A3E85; margin-top: 0;">Your Book is Ready to Read! 📖</h2>
    <p>Dear <strong>${params.customerName}</strong>,</p>
    <p>Thank you for purchasing <strong>&ldquo;${params.bookTitle}&rdquo;</strong> by ${params.bookAuthor}. Your payment has been verified, and your digital reading license has been unlocked with lifetime access.</p>
    
    <div style="background-color: #FAF7F0; border-radius: 12px; padding: 18px 22px; margin: 24px 0; border: 1px solid #EFE8DA;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="color: #7A7265; padding: 4px 0;">Order Reference:</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace;">${params.orderId}</td>
        </tr>
        <tr>
          <td style="color: #7A7265; padding: 4px 0;">Volume:</td>
          <td style="text-align: right; font-weight: bold;">${params.bookTitle}</td>
        </tr>
        <tr>
          <td style="color: #7A7265; padding: 4px 0;">Amount Paid:</td>
          <td style="text-align: right; font-weight: bold; color: #5A3E85;">₹${params.amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color: #7A7265; padding: 4px 0;">Access License:</td>
          <td style="text-align: right; font-weight: bold; color: #3D785D;">Full Lifetime Access</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.readUrl}" class="btn">Open in 3D Reader</a>
    </div>

    <p style="font-size: 13px; color: #7A7265;">You can also access this volume at any time from your <strong>My Library &rarr; Purchased</strong> collection.</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `Order Confirmed: "${params.bookTitle}" is Unlocked on READORA`,
    html: wrapBrandEmailTemplate(`Book Unlocked: ${params.bookTitle}`, body),
  });
}

/**
 * 2. Subscription Welcome Email
 */
export async function sendSubscriptionStartedEmail(params: {
  to: string;
  customerName: string;
  planName: string;
  price: number;
  interval: string;
}) {
  const body = `
    <h2 style="color: #5A3E85; margin-top: 0;">Welcome to Readora Premium! ✨</h2>
    <p>Dear <strong>${params.customerName}</strong>,</p>
    <p>Your subscription to <strong>${params.planName}</strong> is now active. You have unlocked unlimited access to our curated premium catalogue, personalized highlights, synchronized bookmarks, and 3D reading library.</p>
    
    <div style="background-color: #FAF7F0; border-radius: 12px; padding: 18px 22px; margin: 24px 0; border: 1px solid #EFE8DA;">
      <p style="margin: 0; font-size: 14px;"><strong>Plan:</strong> ${params.planName}</p>
      <p style="margin: 6px 0 0 0; font-size: 14px;"><strong>Billing:</strong> ₹${params.price}/${params.interval}</p>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #3D785D;"><strong>Status:</strong> Active &amp; Ready</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://readora.library/explore" class="btn">Explore Premium Library</a>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Welcome to Readora Premium — Unlimited Digital Reading`,
    html: wrapBrandEmailTemplate("Readora Premium Active", body),
  });
}

/**
 * 3. Welcome Email on Signup
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const body = `
    <h2 style="color: #5A3E85; margin-top: 0;">Welcome to the Sanctuary of Stories 📚</h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Welcome to <strong>READORA</strong>. We believe every story deserves a beautiful place to be read.</p>
    <p>As a member, you can preview books freely, experience our realistic 3D page-turning engine, organize your personal library, and read in complete comfort.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://readora.library/explore" class="btn">Start Reading Today</a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Welcome to READORA — A Beautiful Home for Books`,
    html: wrapBrandEmailTemplate("Welcome to Readora", body),
  });
}

/**
 * 4. Admin Security / Sales Alert
 */
export async function sendAdminAlertEmail(subject: string, message: string) {
  const config = await getSmtpConfig();
  if (!config.adminAlertEmail) return;

  const body = `
    <h3 style="color: #5A3E85; margin-top: 0;">System Notification</h3>
    <div style="background-color: #FAF7F0; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px;">
      ${message}
    </div>
    <p style="font-size: 12px; color: #7A7265; margin-top: 15px;">Generated automatically by READORA Core Engine.</p>
  `;

  return sendEmail({
    to: config.adminAlertEmail,
    subject: `[READORA ADMIN ALERT] ${subject}`,
    html: wrapBrandEmailTemplate(subject, body),
  });
}

/**
 * 5. Test Email utility for Admin settings test
 */
export async function testSmtpConnection(testRecipient: string) {
  const { transporter, config } = await createTransporter();

  if (!transporter) {
    return {
      success: false,
      error: "SMTP credentials not provided. Please enter your SMTP Host, User, and Password.",
    };
  }

  try {
    // Verify connection configuration
    await transporter.verify();

    // Send actual test message
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: testRecipient,
      subject: "READORA SMTP Configuration Test",
      text: "Congratulations! Your SMTP email connection is working perfectly.",
      html: wrapBrandEmailTemplate(
        "SMTP Test Successful",
        `
        <h2 style="color: #3D785D;">SMTP Test Succeeded! ✅</h2>
        <p>This email confirms that your READORA SMTP email server configuration is correctly configured and ready to dispatch notifications, invoices, and alerts.</p>
        <p><strong>Server Host:</strong> ${config.host}:${config.port}</p>
        <p><strong>From Address:</strong> ${config.fromEmail}</p>
        `
      ),
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to connect to SMTP server" };
  }
}
