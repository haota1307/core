import { z } from "zod";

export type PasswordPolicy = {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
};

const defaultPasswordPolicy: PasswordPolicy = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: false,
};

/**
 * Factory to create Zod schemas with i18n error messages and dynamic password policy
 */
export const createAuthSchemas = (
  t: (key: string) => string,
  policy: PasswordPolicy = defaultPasswordPolicy
) => {
  // Build password schema with dynamic requirements
  let passwordSchema = z
    .string({ message: t("auth.validation.passwordRequired") })
    .min(policy.passwordMinLength, t("auth.validation.passwordMinLength"))
    .max(100, t("auth.validation.passwordMaxLength"));

  // Add regex validations based on policy
  if (policy.passwordRequireUppercase) {
    passwordSchema = passwordSchema.refine(
      (val) => /[A-Z]/.test(val),
      t("auth.validation.passwordRequireUppercase")
    ) as any;
  }
  if (policy.passwordRequireLowercase) {
    passwordSchema = passwordSchema.refine(
      (val) => /[a-z]/.test(val),
      t("auth.validation.passwordRequireLowercase")
    ) as any;
  }
  if (policy.passwordRequireNumber) {
    passwordSchema = passwordSchema.refine(
      (val) => /[0-9]/.test(val),
      t("auth.validation.passwordRequireNumber")
    ) as any;
  }
  if (policy.passwordRequireSpecial) {
    passwordSchema = passwordSchema.refine(
      (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val),
      t("auth.validation.passwordRequireSpecial")
    ) as any;
  }

  const loginSchema = z.object({
    email: z
      .string({ message: t("auth.validation.emailRequired") })
      .email(t("auth.validation.emailInvalid")),
    password: z
      .string({ message: t("auth.validation.passwordRequired") })
      .min(1, t("auth.validation.passwordRequired")),
  });

  const registerSchema = z
    .object({
      name: z
        .string({ message: t("auth.validation.nameRequired") })
        .min(2, t("auth.validation.nameMinLength"))
        .max(100, t("auth.validation.nameMaxLength")),
      email: z
        .string({ message: t("auth.validation.emailRequired") })
        .email(t("auth.validation.emailInvalid")),
      password: passwordSchema,
      confirmPassword: z.string({
        message: t("auth.validation.confirmPasswordRequired"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    });

  return {
    loginSchema,
    registerSchema,
  };
};

export type LoginInput = z.infer<
  ReturnType<typeof createAuthSchemas>["loginSchema"]
>;
export type RegisterInput = z.infer<
  ReturnType<typeof createAuthSchemas>["registerSchema"]
>;
