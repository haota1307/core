import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac";
import { createAuditLog, AuditAction } from "@/lib/audit-log";
import { sendTestEmail } from "@/lib/email";

/**
 * POST /api/settings/email/test
 * Send a test email to verify email settings
 */
export const POST = withPermission(
  "settings.edit",
  async (request: NextRequest, context, authContext) => {
    try {
      const body = await request.json();
      const { email } = body;

      if (!email) {
        return NextResponse.json(
          { error: "Email address is required" },
          { status: 400 }
        );
      }

      // Send test email using configured SMTP settings
      await sendTestEmail(email);

      // Audit log
      await createAuditLog(
        {
          userId: authContext!.user.id,
          action: AuditAction.SETTING_UPDATE,
          entityType: "email_test",
          entityName: `Test email sent to ${email}`,
          metadata: { email },
        },
        request
      );

      return NextResponse.json({
        message: "Test email sent successfully",
      });
    } catch (error: any) {
      console.error("[EMAIL_TEST]", error);
      return NextResponse.json(
        { error: error.message || "Failed to send test email" },
        { status: 500 }
      );
    }
  }
);
