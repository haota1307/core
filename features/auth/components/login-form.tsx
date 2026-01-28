"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAuthSchemas, type LoginInput } from "../schemas";
import { useLogin } from "../hooks/use-auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tAll = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { loginSchema } = createAuthSchemas((key, params) => tAll(key, params));
  const loginMutation = useLogin();

  // Handle Google OAuth errors from URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: t("errors.GOOGLE_AUTH_FAILED"),
        missing_code: t("errors.GOOGLE_AUTH_FAILED"),
        oauth_not_configured: t("errors.GOOGLE_NOT_CONFIGURED"),
        token_exchange_failed: t("errors.GOOGLE_AUTH_FAILED"),
        user_info_failed: t("errors.GOOGLE_AUTH_FAILED"),
        callback_failed: t("errors.GOOGLE_AUTH_FAILED"),
      };
      toast.error(errorMessages[error] || t("errors.UNKNOWN_ERROR"));
    }
  }, [searchParams, t]);

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    // Redirect to Google OAuth endpoint
    window.location.href = `/api/auth/google?locale=${locale}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || loginMutation.isPending}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Image
                      src="/google-icon.svg"
                      alt="Google icon"
                      width={20}
                      height={20}
                    />
                  )}
                  {t("signInWithGoogle")}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                {t("orContinueWith")}
              </FieldSeparator>
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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">
                    {tCommon("password")}
                  </FieldLabel>
                  <LocaleLink
                    href="/auth/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    {t("forgotPassword")}
                  </LocaleLink>
                </div>
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
                <Button type="submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending
                    ? tCommon("loading")
                    : tCommon("login")}
                </Button>
                <FieldDescription className="text-center">
                  {t("noAccount")}{" "}
                  <LocaleLink href="/auth/register" className="text-primary">
                    {tCommon("register")}
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
