"use client";

import { useMemo } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAuthSchemas, type RegisterInput } from "../schemas";
import { useRegister, usePasswordPolicy } from "../hooks/use-auth";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tAll = useTranslations();

  const { data: passwordPolicy, isLoading: policyLoading } =
    usePasswordPolicy();

  const { registerSchema, passwordRequirements } = useMemo(() => {
    const schemas = createAuthSchemas(
      (key: string) => tAll(key),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data);
  };

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
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
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
                  disabled={registerMutation.isPending || policyLoading}
                >
                  {registerMutation.isPending
                    ? tCommon("loading")
                    : tCommon("register")}
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
