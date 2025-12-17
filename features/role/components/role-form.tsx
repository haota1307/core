"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRoleSchema, updateRoleSchema, RoleResponse } from "../schemas";
import { z } from "zod";
import { useTranslations } from "next-intl";

interface RoleFormProps {
  role?: RoleResponse;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function RoleForm({
  role,
  onSubmit,
  isLoading,
  onCancel,
}: RoleFormProps) {
  const t = useTranslations("roles.form");

  const isEditMode = !!role;
  const schema = isEditMode ? updateRoleSchema : createRoleSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
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
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  {...field}
                  value={field.value || ""}
                  disabled={isLoading}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
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
            {isLoading ? t("saving") : isEditMode ? t("update") : t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
