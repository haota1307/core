"use client";

import { useMemo, useState, useEffect } from "react";
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
import { createAuthSchemas, type RegisterInput } from "../schemas";
import { 
  useRegister, 
  usePasswordPolicy, 
  useSendVerificationCode,
  useVerifyCode 
} from "../hooks/use-auth";
import { toast } from "sonner";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";

type Step = "form" | "verify" | "success";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tAll = useTranslations();

  const [step, setStep] = useState<Step>("form");
  const [verificationCode, setVerificationCode] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: passwordPolicy, isLoading: policyLoading } =
    usePasswordPolicy();

  const { registerSchema, passwordRequirements } = useMemo(() => {
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

    return {
      registerSchema: schemas.registerSchema,
      passwordRequirements: requirements.join(", "),
    };
  }, [passwordPolicy, tAll]);

  const registerMutation = useRegister();
  const sendCodeMutation = useSendVerificationCode();
  const verifyCodeMutation = useVerifyCode();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (data: RegisterInput) => {
    setUserEmail(data.email);
    
    // Send verification code
    sendCodeMutation.mutate(
      { email: data.email, type: "email_verify" },
      {
        onSuccess: () => {
          toast.success(t("verificationCodeSent"));
          setStep("verify");
          setCountdown(60);
        },
      }
    );
  };

  const handleVerifyCode = async (codeValue?: string) => {
    const code = codeValue || verificationCode;
    
    // Prevent double submission
    if (isVerifying || verifyCodeMutation.isPending || registerMutation.isPending) {
      return;
    }
    
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      toast.error(t("invalidVerificationCode"));
      return;
    }

    setIsVerifying(true);
    
    verifyCodeMutation.mutate(
      { email: userEmail, code, type: "email_verify" },
      {
        onSuccess: () => {
          // Now complete registration
          const formData = getValues();
          registerMutation.mutate(formData, {
            onSuccess: () => {
              setStep("success");
              setIsVerifying(false);
            },
            onError: () => {
              setIsVerifying(false);
            },
          });
        },
        onError: () => {
          setIsVerifying(false);
        },
      }
    );
  };

  const handleResendCode = () => {
    if (countdown > 0) return;
    
    sendCodeMutation.mutate(
      { email: userEmail, type: "email_verify" },
      {
        onSuccess: () => {
          toast.success(t("verificationCodeSent"));
          setCountdown(60);
          setVerificationCode("");
        },
      }
    );
  };

  // Verification step
  if (step === "verify") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">{t("verifyEmail")}</CardTitle>
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
                disabled={isVerifying || verifyCodeMutation.isPending || registerMutation.isPending}
                error={verifyCodeMutation.isError}
              />

              <Button
                className="w-full"
                onClick={() => handleVerifyCode()}
                disabled={
                  verificationCode.length !== 6 ||
                  isVerifying ||
                  verifyCodeMutation.isPending ||
                  registerMutation.isPending
                }
              >
                {isVerifying || verifyCodeMutation.isPending || registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon("loading")}
                  </>
                ) : (
                  t("verifyAndRegister")
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {t("didntReceiveCode")}{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || sendCodeMutation.isPending}
                  className={cn(
                    "text-primary hover:underline",
                    (countdown > 0 || sendCodeMutation.isPending) && 
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
                  setStep("form");
                  setVerificationCode("");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToForm")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success step
  if (step === "success") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">{t("registrationSuccess")}</CardTitle>
            <CardDescription>{t("registrationSuccessMessage")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LocaleLink href="/dashboard">
              <Button className="w-full">{t("goToDashboard")}</Button>
            </LocaleLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form step
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("registerTitle")}</CardTitle>
          <CardDescription>{t("registerDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">{tCommon("fullName")}</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("namePlaceholder")}
                  {...register("name")}
                />
                {errors.name && (
                  <FieldDescription className="text-destructive">
                    {errors.name.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">{tCommon("email")}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  {...register("email")}
                />
                {errors.email && (
                  <FieldDescription className="text-destructive">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">
                      {tCommon("password")}
                    </FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("passwordPlaceholder")}
                      {...register("password")}
                    />
                    {errors.password && (
                      <FieldDescription className="text-destructive">
                        {errors.password.message}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      {tCommon("confirmPassword")}
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder={t("confirmPasswordPlaceholder")}
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <FieldDescription className="text-destructive">
                        {errors.confirmPassword.message}
                      </FieldDescription>
                    )}
                  </Field>
                </Field>
                <FieldDescription>{passwordRequirements}</FieldDescription>
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={
                    registerMutation.isPending || 
                    sendCodeMutation.isPending || 
                    policyLoading
                  }
                >
                  {sendCodeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("sendingCode")}
                    </>
                  ) : (
                    tCommon("register")
                  )}
                </Button>
                <FieldDescription className="text-center">
                  {t("hasAccount")}{" "}
                  <LocaleLink href="/auth/login" className="text-primary">
                    {tCommon("login")}
                  </LocaleLink>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t("termsAndConditions")}
      </FieldDescription>
    </div>
  );
}
