"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FileText, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor, type Editor } from "@/components/ui/rich-text-editor";
import {
  createEmailTemplateSchema,
  EmailTemplateResponse,
  CreateEmailTemplateInput,
} from "../schemas";
import {
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
} from "../hooks/use-settings";

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplateResponse;
}

// System variables available for email templates
const SYSTEM_VARIABLES = [
  { key: "name", description: "Tên người dùng" },
  { key: "email", description: "Email người dùng" },
  { key: "link", description: "Đường dẫn (xác nhận, đặt lại mật khẩu...)" },
  { key: "siteName", description: "Tên trang web" },
  { key: "siteUrl", description: "URL trang web" },
  { key: "code", description: "Mã xác nhận (OTP)" },
  { key: "date", description: "Ngày hiện tại" },
  { key: "time", description: "Giờ hiện tại" },
];

export function EmailTemplateDialog({
  open,
  onOpenChange,
  template,
}: EmailTemplateDialogProps) {
  const t = useTranslations("settings.email.templates");
  const tCommon = useTranslations("common");
  const isEditMode = !!template;

  const [activeTab, setActiveTab] = useState("editor");
  const editorRef = useRef<Editor | null>(null);

  const form = useForm<CreateEmailTemplateInput>({
    resolver: zodResolver(createEmailTemplateSchema),
    defaultValues: {
      slug: "",
      name: "",
      subject: "",
      body: "",
      bodyType: "html",
      description: "",
      variables: [],
      isActive: true,
    },
  });

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      form.reset({
        slug: template.slug,
        name: template.name,
        subject: template.subject,
        body: template.body,
        bodyType: template.bodyType as "html" | "markdown",
        description: template.description || "",
        variables: [],
        isActive: template.isActive,
      });
    } else {
      form.reset({
        slug: "",
        name: "",
        subject: "",
        body: "",
        bodyType: "html",
        description: "",
        variables: [],
        isActive: true,
      });
    }
  }, [template, form, open]);

  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate(template?.id || "");

  const handleSubmit = async (data: CreateEmailTemplateInput) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Insert variable at cursor position in editor
  const insertVariable = (key: string) => {
    const editor = editorRef.current;
    if (editor) {
      editor.chain().focus().insertContent(`{{${key}}}`).run();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[1600px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEditMode ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 shrink-0">
                <TabsTrigger value="editor">
                  <FileText className="mr-2 h-4 w-4" />
                  {t("tabEditor")}
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="mr-2 h-4 w-4" />
                  {t("tabPreview")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="flex-1 overflow-y-auto mt-4 pr-2">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left column - Template info */}
                  <div className="lg:w-[320px] shrink-0 space-y-4">
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-semibold text-sm">{t("templateInfo") || "Thông tin mẫu"}</h3>
                      
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("nameLabel")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("namePlaceholder")}
                                {...field}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("slugLabel")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("slugPlaceholder")}
                                {...field}
                                disabled={isPending || (isEditMode && template?.isSystem)}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">{t("slugDescription")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("descriptionLabel")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("descriptionPlaceholder")}
                                {...field}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">{t("isActiveLabel")}</FormLabel>
                              <FormDescription className="text-xs">{t("isActiveDescription")}</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isPending}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* System variables */}
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{t("availableVariables") || "Biến có sẵn"}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {t("clickToInsert") || "Click để chèn vào vị trí con trỏ"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {SYSTEM_VARIABLES.map((v) => (
                          <TooltipProvider key={v.key}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                                  onClick={() => insertVariable(v.key)}
                                >
                                  {`{{${v.key}}}`}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{v.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right column - Email content */}
                  <div className="flex-1 min-w-0 space-y-4">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("subjectLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("subjectPlaceholder")}
                              {...field}
                              disabled={isPending}
                              className="text-lg"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {t("subjectDescription")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t("bodyLabel")}</FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                              disabled={isPending}
                              editorRef={editorRef}
                              className="min-h-[400px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 border-b">
                    <p className="text-xs text-muted-foreground mb-1">{t("previewSubject")}</p>
                    <p className="font-medium text-lg">{form.watch("subject") || t("noSubject")}</p>
                  </div>
                  <div className="p-6 bg-white dark:bg-zinc-950 min-h-[400px]">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: form.watch("body") || `<p class="text-muted-foreground">${t("noBody")}</p>`,
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                {isEditMode ? t("updateButton") : t("createButton")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
