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

interface NotificationSettings {
  emailOnNewUser: boolean;
  emailOnPasswordReset: boolean;
  emailOnLoginAlert: boolean;
  emailOnSystemAlert: boolean;
  adminEmails: string[];
}

// Notification types
export type NotificationType = 
  | "new_user" 
  | "password_reset" 
  | "login_alert" 
  | "system_alert";

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

/**
 * Get notification settings from database
 */
async function getNotificationSettings(): Promise<NotificationSettings> {
  const settings = await prisma.setting.findMany({
    where: {
      group: SettingGroup.NOTIFICATION,
    },
  });

  const settingsMap: Record<string, unknown> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const getBoolean = (key: string): boolean => {
    const val = settingsMap[key];
    return val === true || val === "true";
  };

  const getStringArray = (key: string): string[] => {
    const val = settingsMap[key];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return val.split(",").map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  return {
    emailOnNewUser: getBoolean("emailOnNewUser"),
    emailOnPasswordReset: getBoolean("emailOnPasswordReset"),
    emailOnLoginAlert: getBoolean("emailOnLoginAlert"),
    emailOnSystemAlert: getBoolean("emailOnSystemAlert"),
    adminEmails: getStringArray("adminEmails"),
  };
}

/**
 * Check if notification should be sent based on settings
 */
async function shouldSendNotification(type: NotificationType): Promise<boolean> {
  const settings = await getNotificationSettings();
  
  switch (type) {
    case "new_user":
      return settings.emailOnNewUser;
    case "password_reset":
      return settings.emailOnPasswordReset;
    case "login_alert":
      return settings.emailOnLoginAlert;
    case "system_alert":
      return settings.emailOnSystemAlert;
    default:
      return false;
  }
}

/**
 * Get admin emails from notification settings
 */
export async function getAdminEmails(): Promise<string[]> {
  const settings = await getNotificationSettings();
  return settings.adminEmails;
}

/**
 * Send notification email to admins
 */
export async function sendAdminNotification(
  type: NotificationType,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  const shouldSend = await shouldSendNotification(type);
  if (!shouldSend) {
    return; // Notification disabled in settings
  }

  const adminEmails = await getAdminEmails();
  if (adminEmails.length === 0) {
    return; // No admin emails configured
  }

  await sendEmail({
    to: adminEmails,
    subject,
    html,
    text,
  });
}

/**
 * Send new user registration notification to admins
 */
export async function sendNewUserNotification(user: {
  name?: string | null;
  email: string;
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New User Registration</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 20px;">👤 New User Registered</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          A new user has registered on your platform.
        </p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Name:</strong> ${user.name || "Not provided"}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAdminNotification(
    "new_user",
    "New User Registration",
    html,
    `New user registered: ${user.name || user.email}`
  );
}

/**
 * Send password reset notification to admins
 */
export async function sendPasswordResetNotification(user: {
  name?: string | null;
  email: string;
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset Request</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 20px;">🔑 Password Reset Request</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          A user has requested a password reset.
        </p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Name:</strong> ${user.name || "Not provided"}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAdminNotification(
    "password_reset",
    "Password Reset Request",
    html,
    `Password reset requested by: ${user.name || user.email}`
  );
}

/**
 * Send login alert notification to admins (for suspicious logins)
 */
export async function sendLoginAlertNotification(user: {
  name?: string | null;
  email: string;
}, details: {
  ip?: string;
  userAgent?: string;
  location?: string;
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Login Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #e74c3c; margin-bottom: 20px;">⚠️ Login Alert</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          A login was detected from a new device or location.
        </p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>User:</strong> ${user.name || user.email}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
          ${details.ip ? `<p style="margin: 5px 0;"><strong>IP Address:</strong> ${details.ip}</p>` : ""}
          ${details.userAgent ? `<p style="margin: 5px 0;"><strong>Browser:</strong> ${details.userAgent}</p>` : ""}
          ${details.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${details.location}</p>` : ""}
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAdminNotification(
    "login_alert",
    "Login Alert",
    html,
    `Login detected: ${user.name || user.email} from ${details.ip || "unknown IP"}`
  );
}

/**
 * Send system alert notification to admins
 */
export async function sendSystemAlertNotification(
  title: string,
  message: string,
  severity: "info" | "warning" | "error" = "info"
): Promise<void> {
  const severityColors = {
    info: "#3498db",
    warning: "#f39c12",
    error: "#e74c3c",
  };

  const severityIcons = {
    info: "ℹ️",
    warning: "⚠️",
    error: "🚨",
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>System Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: ${severityColors[severity]}; margin-bottom: 20px;">${severityIcons[severity]} ${title}</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          ${message}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Time: ${new Date().toLocaleString()}
        </p>
      </div>
    </body>
    </html>
  `;

  await sendAdminNotification(
    "system_alert",
    `[${severity.toUpperCase()}] ${title}`,
    html,
    `${title}: ${message}`
  );
}

