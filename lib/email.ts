import nodemailer from "nodemailer";
import prisma from "./prisma";
import { SettingGroup } from "@/features/settings/schemas";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SMTPSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  fromName?: string;
  fromEmail?: string;
}

/**
 * Get email settings from database
 */
async function getEmailSettings(): Promise<SMTPSettings> {
  const settings = await prisma.setting.findMany({
    where: {
      group: SettingGroup.EMAIL,
    },
  });

  const settingsMap: Record<string, unknown> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const getString = (key: string): string | undefined => {
    const val = settingsMap[key];
    return typeof val === "string" ? val : undefined;
  };

  const getNumber = (key: string, defaultVal: number): number => {
    const val = settingsMap[key];
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseInt(val, 10) || defaultVal;
    return defaultVal;
  };

  const getBoolean = (key: string): boolean => {
    const val = settingsMap[key];
    return val === true || val === "true";
  };

  return {
    smtpHost: getString("smtpHost"),
    smtpPort: getNumber("smtpPort", 587),
    smtpSecure: getBoolean("smtpSecure"),
    smtpUsername: getString("smtpUsername"),
    smtpPassword: getString("smtpPassword"),
    fromName: getString("fromName"),
    fromEmail: getString("fromEmail"),
  };
}

/**
 * Create nodemailer transport from settings
 */
function createTransport(settings: SMTPSettings) {
  if (!settings.smtpHost) {
    throw new Error("SMTP host is not configured");
  }

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure || false,
    auth: settings.smtpUsername
      ? {
          user: settings.smtpUsername,
          pass: settings.smtpPassword,
        }
      : undefined,
  });
}

/**
 * Send an email using configured SMTP settings
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const settings = await getEmailSettings();
  const transport = createTransport(settings);

  const fromAddress = settings.fromName
    ? `"${settings.fromName}" <${settings.fromEmail || settings.smtpUsername}>`
    : settings.fromEmail || settings.smtpUsername;

  await transport.sendMail({
    from: fromAddress,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

/**
 * Send a test email to verify SMTP settings
 */
export async function sendTestEmail(toEmail: string): Promise<void> {
  const settings = await getEmailSettings();
  const transport = createTransport(settings);

  const fromAddress = settings.fromName
    ? `"${settings.fromName}" <${settings.fromEmail || settings.smtpUsername}>`
    : settings.fromEmail || settings.smtpUsername;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 20px;">✅ Test Email Successful!</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          This is a test email to verify that your SMTP settings are configured correctly.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          If you received this email, your email configuration is working properly.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 14px;">
          <strong>SMTP Settings:</strong><br>
          Host: ${settings.smtpHost}<br>
          Port: ${settings.smtpPort}<br>
          Secure: ${settings.smtpSecure ? "Yes" : "No"}
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Sent at: ${new Date().toLocaleString()}
        </p>
      </div>
    </body>
    </html>
  `;

  await transport.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: "Test Email - SMTP Configuration Verified",
    html,
    text: "This is a test email to verify that your SMTP settings are configured correctly.",
  });
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const settings = await getEmailSettings();
    const transport = createTransport(settings);
    await transport.verify();
    return true;
  } catch {
    return false;
  }
}

