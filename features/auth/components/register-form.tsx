"use client";

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

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("registerTitle")}</CardTitle>
          <CardDescription>{t("registerDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input id="name" type="text" placeholder="John Doe" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">{tCommon("email")}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  required
                />
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
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      {tCommon("confirmPassword")}
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder={t("confirmPasswordPlaceholder")}
                      required
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit">{tCommon("register")}</Button>
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
