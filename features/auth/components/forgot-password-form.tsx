"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LocaleLink } from "@/components/locale-link";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createAuthSchemas } from "../schemas";
import { 
  useForgotPassword, 
  useVerifyCode,
  useResetPassword,
  usePasswordPolicy 
} from "../hooks/use-auth";
import { toast } from "sonner";
import { ArrowLeft, Mail, KeyRound, CheckCircle2, Loader2 } from "lucide-react";

type Step = "email" | "verify" | "reset" | "success";

const emailSchema = z.object({
  email: z.string().email(),
});

type EmailInput = z.infer<typeof emailSchema>;

interface ResetPasswordInput {
  newPassword: string;
  confirmPassword: string;
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tAll = useTranslations();

  const [step, setStep] = useState<Step>("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: passwordPolicy } = usePasswordPolicy();

  const { resetPasswordSchema, passwordRequirements } = useMemo(() => {
    const schemas = createAuthSchemas(
      (key, params) => tAll(key, params),
      passwordPolicy
    );

    // Build password requirements text
    const requirements: string[] = [];
    if (passwordPolicy) {
      requirements.push(
        tAll("auth.validation.passwordMinLengthHint", {
          count: passwordPolicy.passwordMinLength,
        })
      );
      if (passwordPolicy.passwordRequireUppercase) {
        requirements.push(tAll("auth.validation.requireUppercaseHint"));
      }
      if (passwordPolicy.passwordRequireLowercase) {
        requirements.push(tAll("auth.validation.requireLowercaseHint"));
      }
      if (passwordPolicy.passwordRequireNumber) {
        requirements.push(tAll("auth.validation.requireNumberHint"));
      }
      if (passwordPolicy.passwordRequireSpecial) {
        requirements.push(tAll("auth.validation.requireSpecialHint"));
      }
    } else {
      requirements.push(
        tAll("auth.validation.passwordMinLengthHint", { count: 8 })
      );
    }

    // Create schema for reset password form
    const resetSchema = z.object({
      newPassword: schemas.registerSchema.shape.password,
      confirmPassword: z.string(),
    }).refine((data) => data.newPassword === data.confirmPassword, {
      message: tAll("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    });

    return {
      resetPasswordSchema: resetSchema,
      passwordRequirements: requirements.join(", "),
    };
  }, [passwordPolicy, tAll]);

  const forgotPasswordMutation = useForgotPassword();
  const verifyCodeMutation = useVerifyCode();
  const resetPasswordMutation = useResetPassword();

  // Email form
  const emailForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
  });

  // Reset password form
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmitEmail = async (data: EmailInput) => {
    setUserEmail(data.email);
    
    forgotPasswordMutation.mutate(data.email, {
      onSuccess: () => {
        toast.success(t("verificationCodeSent"));
        setStep("verify");
        setCountdown(60);
      },
    });
  };

  const handleVerifyCode = async (codeValue?: string) => {
    const code = codeValue || verificationCode;
    
    // Prevent double submission
    if (isVerifying || verifyCodeMutation.isPending) {
      return;
    }
    
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      toast.error(t("invalidVerificationCode"));
      return;
    }

    setIsVerifying(true);
    
    verifyCodeMutation.mutate(
      { email: userEmail, code, type: "password_reset" },
      {
        onSuccess: () => {
          setStep("reset");
          setIsVerifying(false);
        },
        onError: () => {
          setIsVerifying(false);
        },
      }
    );
  };

  const handleResendCode = () => {
    if (countdown > 0) return;
    
    forgotPasswordMutation.mutate(userEmail, {
      onSuccess: () => {
        toast.success(t("verificationCodeSent"));
        setCountdown(60);
        setVerificationCode("");
      },
    });
  };

  const onSubmitReset = async (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(
      { 
        email: userEmail, 
        code: verificationCode, 
        newPassword: data.newPassword 
      },
      {
        onSuccess: () => {
          setStep("success");
        },
      }
    );
  };

  // Email step
  if (step === "email") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">{t("forgotPassword")}</CardTitle>
            <CardDescription>{t("forgotPasswordDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">{tCommon("email")}</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    {...emailForm.register("email")}
                  />
                  {emailForm.formState.errors.email && (
                    <FieldDescription className="text-destructive">
                      {emailForm.formState.errors.email.message}
                    </FieldDescription>
                  )}
                </Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("sendingCode")}
                    </>
                  ) : (
                    t("sendResetCode")
                  )}
                </Button>
                <FieldDescription className="text-center">
                  {t("rememberPassword")}{" "}
                  <LocaleLink href="/auth/login" className="text-primary">
                    {tCommon("login")}
                  </LocaleLink>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verification step
  if (step === "verify") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">{t("verifyCode")}</CardTitle>
            <CardDescription>
              {t("verificationCodeSentTo", { email: userEmail })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <VerificationCodeInput
                value={verificationCode}
                onChange={setVerificationCode}
                onComplete={handleVerifyCode}
                disabled={isVerifying || verifyCodeMutation.isPending}
                error={verifyCodeMutation.isError}
              />

              <Button
                className="w-full"
                onClick={() => handleVerifyCode()}
                disabled={
                  verificationCode.length !== 6 ||
                  isVerifying ||
                  verifyCodeMutation.isPending
                }
              >
                {isVerifying || verifyCodeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon("loading")}
                  </>
                ) : (
                  t("verifyCode")
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {t("didntReceiveCode")}{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || forgotPasswordMutation.isPending}
                  className={cn(
                    "text-primary hover:underline",
                    (countdown > 0 || forgotPasswordMutation.isPending) && 
                      "opacity-50 cursor-not-allowed"
                  )}
                >
                  {countdown > 0
                    ? t("resendCodeIn", { seconds: countdown })
                    : t("resendCode")}
                </button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setVerificationCode("");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToEmail")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password step
  if (step === "reset") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">{t("resetPassword")}</CardTitle>
            <CardDescription>{t("resetPasswordDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={resetForm.handleSubmit(onSubmitReset)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="newPassword">
                    {t("newPassword")}
                  </FieldLabel>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder={t("newPasswordPlaceholder")}
                    {...resetForm.register("newPassword")}
                  />
                  {resetForm.formState.errors.newPassword && (
                    <FieldDescription className="text-destructive">
                      {resetForm.formState.errors.newPassword.message}
                    </FieldDescription>
                  )}
                  <FieldDescription>{passwordRequirements}</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">
                    {tCommon("confirmPassword")}
                  </FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    {...resetForm.register("confirmPassword")}
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <FieldDescription className="text-destructive">
                      {resetForm.formState.errors.confirmPassword.message}
                    </FieldDescription>
                  )}
                </Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tCommon("loading")}
                    </>
                  ) : (
                    t("resetPassword")
                  )}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success step
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">{t("passwordResetSuccess")}</CardTitle>
          <CardDescription>{t("passwordResetSuccessMessage")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleLink href="/auth/login">
            <Button className="w-full">{tCommon("login")}</Button>
          </LocaleLink>
        </CardContent>
      </Card>
    </div>
  );
}

