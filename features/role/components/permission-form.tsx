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
import {
  createPermissionSchema,
  updatePermissionSchema,
  PermissionResponse,
} from "../schemas";
import { z } from "zod";
import { useTranslations } from "next-intl";

interface PermissionFormProps {
  permission?: PermissionResponse;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function PermissionForm({
  permission,
  onSubmit,
  isLoading,
  onCancel,
}: PermissionFormProps) {
  const t = useTranslations("permissions.form");

  const isEditMode = !!permission;
  const schema = isEditMode ? updatePermissionSchema : createPermissionSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: permission?.code || "",
      description: permission?.description || "",
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Code */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("code")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("codePlaceholder")}
                  {...field}
                  disabled={isLoading || isEditMode}
                  className="font-mono"
                />
              </FormControl>
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  {t("codeCannotChange")}
                </p>
              )}
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

