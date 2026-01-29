"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { MediaPicker } from "@/features/media/components/media-picker";
import {
  createCourseSchema,
  updateCourseSchema,
  CourseResponse,
  CreateCourseInput,
  UpdateCourseInput,
  CategoryResponse,
} from "../schemas";
import { z } from "zod";
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CourseFormProps {
  course?: CourseResponse;
  categories?: CategoryResponse[];
  onSubmit: (data: CreateCourseInput | UpdateCourseInput) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function CourseForm({
  course,
  categories = [],
  onSubmit,
  isLoading,
  onCancel,
}: CourseFormProps) {
  const t = useTranslations("instructor.courseForm");
  const isEditMode = !!course;
  const schema = isEditMode ? updateCourseSchema : createCourseSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: course?.title || "",
      shortDescription: course?.shortDescription || "",
      description: course?.description || "",
      thumbnail: course?.thumbnail || null,
      previewVideo: course?.previewVideo || null,
      price: course?.price || 0,
      salePrice: course?.salePrice || null,
      currency: course?.currency || "VND",
      level: (course?.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS") || "ALL_LEVELS",
      language: course?.language || "vi",
      categoryId: course?.categoryId || null,
      requirements: course?.requirements || [],
      objectives: course?.objectives || [],
      targetAudience: course?.targetAudience || [],
    },
  });

  // State for array fields
  const [requirementInput, setRequirementInput] = useState("");
  const [objectiveInput, setObjectiveInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");

  const addToArray = (
    fieldName: "requirements" | "objectives" | "targetAudience",
    value: string,
    setValue: (value: string) => void
  ) => {
    if (value.trim()) {
      const current = form.getValues(fieldName) || [];
      form.setValue(fieldName, [...current, value.trim()]);
      setValue("");
    }
  };

  const removeFromArray = (
    fieldName: "requirements" | "objectives" | "targetAudience",
    index: number
  ) => {
    const current = form.getValues(fieldName) || [];
    form.setValue(
      fieldName,
      current.filter((_, i) => i !== index)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("basicInfo")}</h3>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("title")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("titlePlaceholder")}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shortDescription")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("shortDescriptionPlaceholder")}
                    {...field}
                    value={field.value || ""}
                    disabled={isLoading}
                    rows={2}
                  />
                </FormControl>
                <FormDescription>{t("shortDescriptionHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    rows={6}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Media */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("media")}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("thumbnail")}</FormLabel>
                  <FormControl>
                    <MediaPicker
                      value={field.value || undefined}
                      onChange={field.onChange}
                      accept="image/*"
                      placeholder={t("thumbnailPlaceholder")}
                    />
                  </FormControl>
                  <FormDescription>{t("thumbnailHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previewVideo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("previewVideo")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("previewVideoPlaceholder")}
                      {...field}
                      value={field.value || ""}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>{t("previewVideoHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Category & Level */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("categoryAndLevel")}</h3>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("categoryPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("level")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("levelPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BEGINNER">{t("levels.beginner")}</SelectItem>
                      <SelectItem value="INTERMEDIATE">{t("levels.intermediate")}</SelectItem>
                      <SelectItem value="ADVANCED">{t("levels.advanced")}</SelectItem>
                      <SelectItem value="ALL_LEVELS">{t("levels.allLevels")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("language")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("languagePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("pricing")}</h3>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("price")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("salePrice")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder={t("salePricePlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : null)
                      }
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>{t("salePriceHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("currency")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VND">VND</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("requirements")}</h3>
          <FormField
            control={form.control}
            name="requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("requirementsLabel")}</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("requirementPlaceholder")}
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToArray("requirements", requirementInput, setRequirementInput);
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      addToArray("requirements", requirementInput, setRequirementInput)
                    }
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(field.value || []).map((item, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeFromArray("requirements", index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Objectives */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("objectives")}</h3>
          <FormField
            control={form.control}
            name="objectives"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("objectivesLabel")}</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("objectivePlaceholder")}
                    value={objectiveInput}
                    onChange={(e) => setObjectiveInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToArray("objectives", objectiveInput, setObjectiveInput);
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      addToArray("objectives", objectiveInput, setObjectiveInput)
                    }
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(field.value || []).map((item, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeFromArray("objectives", index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Target Audience */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("targetAudience")}</h3>
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("targetAudienceLabel")}</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("audiencePlaceholder")}
                    value={audienceInput}
                    onChange={(e) => setAudienceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToArray("targetAudience", audienceInput, setAudienceInput);
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      addToArray("targetAudience", audienceInput, setAudienceInput)
                    }
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(field.value || []).map((item, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeFromArray("targetAudience", index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
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

