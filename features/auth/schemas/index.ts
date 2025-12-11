import { z } from "zod";

/**
 * Factory to create Zod schemas with i18n error messages
 */
export const createAuthSchemas = (t: (key: string) => string) => {
  const loginSchema = z.object({
    email: z
      .string({ message: t("auth.validation.emailRequired") })
      .email(t("auth.validation.emailInvalid")),
    password: z
      .string({ message: t("auth.validation.passwordRequired") })
      .min(8, t("auth.validation.passwordMinLength"))
      .max(100, t("auth.validation.passwordMaxLength")),
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
      password: z
        .string({ message: t("auth.validation.passwordRequired") })
        .min(8, t("auth.validation.passwordMinLength"))
        .max(100, t("auth.validation.passwordMaxLength")),
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
