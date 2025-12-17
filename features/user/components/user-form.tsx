"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { createUserSchema, updateUserSchema, UserResponse } from "../schemas";
import { useRoles } from "../hooks/use-users";
import { z } from "zod";
import { useTranslations } from "next-intl";

interface UserFormProps {
  user?: UserResponse;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function UserForm({ user, onSubmit, isLoading, onCancel }: UserFormProps) {
  const t = useTranslations("users.form");
  const { data: roles, isLoading: rolesLoading } = useRoles();

  const isEditMode = !!user;
  const schema = isEditMode ? updateUserSchema : createUserSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email || "",
      name: user?.name || "",
      password: "",
      roleId: user?.roleId || undefined,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    // Remove empty password for edit mode
    if (isEditMode && !data.password) {
      const { password, ...rest } = data;
      onSubmit(rest);
    } else {
      onSubmit(data);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("namePlaceholder")}
                  {...field}
                  value={field.value || ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("password")} {isEditMode && t("passwordKeepCurrent")}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={
                    isEditMode ? "••••••••" : t("passwordPlaceholder")
                  }
                  {...field}
                  value={field.value || ""}
                  disabled={isLoading}
                />
              </FormControl>
              {!isEditMode && (
                <FormDescription>{t("passwordDescription")}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role */}
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("role")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
                disabled={isLoading || rolesLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("roleSelect")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{t("roleDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {isEditMode ? t("updateButton") : t("createButton")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
