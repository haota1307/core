"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useCourse,
  useCourseSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useReorderSections,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useReorderLessons,
  instructorKeys,
} from "@/features/instructor/hooks/use-instructor";
import { reorderLessonsAction } from "@/features/instructor/actions";
import {
  CreateSectionInput,
  UpdateSectionInput,
  CreateLessonInput,
  UpdateLessonInput,
  SectionResponse,
  LessonResponse,
} from "@/features/instructor/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Radio,
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  BookOpen,
  BarChart,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CourseMediaPicker } from "@/features/instructor/components";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface CourseContentClientProps {
  courseId: string;
}

const lessonTypeIcons: Record<string, React.ReactNode> = {
  VIDEO: <Video className="h-4 w-4" />,
  TEXT: <FileText className="h-4 w-4" />,
  QUIZ: <HelpCircle className="h-4 w-4" />,
  ASSIGNMENT: <ClipboardList className="h-4 w-4" />,
  LIVE: <Radio className="h-4 w-4" />,
};

// Sortable Section Item Component
function SortableSectionItem({
  section,
  sectionIndex,
  children,
}: {
  section: SectionResponse;
  sectionIndex: number;
  children: (dragHandleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50 z-50")}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

// Sortable Lesson Item Component
function SortableLessonItem({
  lesson,
  children,
}: {
  lesson: LessonResponse;
  children: (dragHandleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50 z-50")}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

// Section Item Component
interface SectionItemProps {
  section: SectionResponse;
  sectionIndex: number;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  handleOpenSectionDialog: (
    mode: "create" | "edit",
    data?: SectionResponse,
  ) => void;
  handleOpenLessonDialog: (
    mode: "create" | "edit",
    sectionId?: string,
    data?: LessonResponse,
  ) => void;
  setDeleteDialog: (
    dialog: {
      open: boolean;
      type: "section" | "lesson";
      id: string;
      title: string;
    } | null,
  ) => void;
  sensors: ReturnType<typeof useSensors>;
  handleLessonDragEnd: (sectionId: string) => (event: DragEndEvent) => void;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  dragHandleProps?: Record<string, unknown>;
}

function SectionItem({
  section,
  sectionIndex,
  expandedSections,
  toggleSection,
  handleOpenSectionDialog,
  handleOpenLessonDialog,
  setDeleteDialog,
  sensors,
  handleLessonDragEnd,
  t,
  tCommon,
  dragHandleProps,
}: SectionItemProps) {
  return (
    <Collapsible
      open={expandedSections.has(section.id)}
      onOpenChange={() => toggleSection(section.id)}
    >
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-4 bg-muted/50">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-grab touch-none"
              {...dragHandleProps}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <div>
              <div className="font-medium">
                {t("section")} {sectionIndex + 1}: {section.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {section.lessons?.length || 0} {t("lessons")}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleOpenLessonDialog("create", section.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addLesson")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenSectionDialog("edit", section)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {tCommon("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  setDeleteDialog({
                    open: true,
                    type: "section",
                    id: section.id,
                    title: section.title,
                  })
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {tCommon("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent>
          <div className="p-4 space-y-2">
            {section.lessons && section.lessons.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleLessonDragEnd(section.id)}
              >
                <SortableContext
                  items={section.lessons.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {section.lessons.map((lesson, lessonIndex) => (
                    <SortableLessonItem key={lesson.id} lesson={lesson}>
                      {(dragHandleProps) => (
                        <LessonItem
                          lesson={lesson}
                          lessonIndex={lessonIndex}
                          sectionId={section.id}
                          handleOpenLessonDialog={handleOpenLessonDialog}
                          setDeleteDialog={setDeleteDialog}
                          t={t}
                          tCommon={tCommon}
                          dragHandleProps={dragHandleProps}
                        />
                      )}
                    </SortableLessonItem>
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p className="mb-2">{t("noLessons")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenLessonDialog("create", section.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addLesson")}
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Lesson Item Component
interface LessonItemProps {
  lesson: LessonResponse;
  lessonIndex: number;
  sectionId: string;
  handleOpenLessonDialog: (
    mode: "create" | "edit",
    sectionId?: string,
    data?: LessonResponse,
  ) => void;
  setDeleteDialog: (
    dialog: {
      open: boolean;
      type: "section" | "lesson";
      id: string;
      title: string;
    } | null,
  ) => void;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  dragHandleProps?: Record<string, unknown>;
}

function LessonItem({
  lesson,
  lessonIndex,
  sectionId,
  handleOpenLessonDialog,
  setDeleteDialog,
  t,
  tCommon,
  dragHandleProps,
}: LessonItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab touch-none"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="flex items-center justify-center h-6 w-6 rounded bg-muted text-xs font-medium">
          {lessonIndex + 1}
        </span>
        {lessonTypeIcons[lesson.type]}
        <span>{lesson.title}</span>
        {lesson.isFree && <Badge variant="secondary">{t("free")}</Badge>}
        {lesson.isPublished ? (
          <Eye className="h-4 w-4 text-green-500" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center gap-2">
        {lesson.videoDuration > 0 && (
          <span className="text-sm text-muted-foreground">
            {Math.floor(lesson.videoDuration / 60)}:
            {(lesson.videoDuration % 60).toString().padStart(2, "0")}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleOpenLessonDialog("edit", sectionId, lesson)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {tCommon("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() =>
                setDeleteDialog({
                  open: true,
                  type: "lesson",
                  id: lesson.id,
                  title: lesson.title,
                })
              }
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {tCommon("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function CourseContentClient({ courseId }: CourseContentClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const t = useTranslations("instructor.content");
  const tCourses = useTranslations("instructor.courses");
  const tCommon = useTranslations("common");

  // Data hooks
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: sections = [], isLoading: sectionsLoading } =
    useCourseSections(courseId);

  // Mutation hooks
  const createSection = useCreateSection();
  const updateSection = useUpdateSection(courseId);
  const deleteSection = useDeleteSection(courseId);
  const reorderSections = useReorderSections(courseId);
  const createLesson = useCreateLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);
  const deleteLesson = useDeleteLesson(courseId);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // UI State
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [sectionDialog, setSectionDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: SectionResponse;
  }>({ open: false, mode: "create" });
  const [lessonDialog, setLessonDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    sectionId?: string;
    data?: LessonResponse;
  }>({ open: false, mode: "create" });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "section" | "lesson";
    id: string;
    title: string;
  } | null>(null);

  // Form state
  const [sectionForm, setSectionForm] = useState({
    title: "",
    description: "",
  });
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    type: "VIDEO" as "VIDEO" | "TEXT" | "QUIZ" | "ASSIGNMENT" | "LIVE",
    videoUrl: "",
    videoDuration: 0,
    content: "",
    isFree: false,
    isPublished: false,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Handle section drag end
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = arrayMove(sections, oldIndex, newIndex);
        const sectionIds = newSections.map((s) => s.id);
        reorderSections.mutate(sectionIds);
      }
    }
  };

  // Handle lesson drag end within a section
  const handleLessonDragEnd =
    (sectionId: string) => async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const section = sections.find((s) => s.id === sectionId);
        if (!section?.lessons) return;

        const oldIndex = section.lessons.findIndex((l) => l.id === active.id);
        const newIndex = section.lessons.findIndex((l) => l.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLessons = arrayMove(section.lessons, oldIndex, newIndex);
          const lessonIds = newLessons.map((l) => l.id);
          await reorderLessonsAction(sectionId, lessonIds);
          // Invalidate sections query to refresh the list
          queryClient.invalidateQueries({
            queryKey: instructorKeys.courseSections(courseId),
          });
        }
      }
    };

  const handleOpenSectionDialog = (
    mode: "create" | "edit",
    data?: SectionResponse,
  ) => {
    if (mode === "edit" && data) {
      setSectionForm({
        title: data.title,
        description: data.description || "",
      });
    } else {
      setSectionForm({ title: "", description: "" });
    }
    setSectionDialog({ open: true, mode, data });
  };

  const handleOpenLessonDialog = (
    mode: "create" | "edit",
    sectionId?: string,
    data?: LessonResponse,
  ) => {
    if (mode === "edit" && data) {
      setLessonForm({
        title: data.title,
        description: data.description || "",
        type: data.type as "VIDEO" | "TEXT" | "QUIZ" | "ASSIGNMENT" | "LIVE",
        videoUrl: data.videoUrl || "",
        videoDuration: data.videoDuration || 0,
        content: data.content || "",
        isFree: data.isFree,
        isPublished: data.isPublished,
      });
    } else {
      setLessonForm({
        title: "",
        description: "",
        type: "VIDEO",
        videoUrl: "",
        videoDuration: 0,
        content: "",
        isFree: false,
        isPublished: false,
      });
    }
    setLessonDialog({ open: true, mode, sectionId, data });
  };

  const handleSaveSection = async () => {
    if (sectionDialog.mode === "create") {
      const input: CreateSectionInput = {
        title: sectionForm.title,
        description: sectionForm.description || undefined,
        courseId,
        sortOrder: sections.length,
      };
      await createSection.mutateAsync(input);
    } else if (sectionDialog.data) {
      const input: UpdateSectionInput = {
        title: sectionForm.title,
        description: sectionForm.description || undefined,
      };
      await updateSection.mutateAsync({ id: sectionDialog.data.id, input });
    }
    setSectionDialog({ open: false, mode: "create" });
  };

  const handleSaveLesson = async () => {
    if (lessonDialog.mode === "create" && lessonDialog.sectionId) {
      const section = sections.find((s) => s.id === lessonDialog.sectionId);
      const input: CreateLessonInput = {
        title: lessonForm.title,
        description: lessonForm.description || undefined,
        type: lessonForm.type,
        videoUrl: lessonForm.videoUrl || undefined,
        videoDuration: lessonForm.videoDuration,
        content: lessonForm.content || undefined,
        isFree: lessonForm.isFree,
        isPublished: lessonForm.isPublished,
        sectionId: lessonDialog.sectionId,
        sortOrder: section?.lessons?.length || 0,
      };
      await createLesson.mutateAsync(input);
    } else if (lessonDialog.data) {
      const input: UpdateLessonInput = {
        title: lessonForm.title,
        description: lessonForm.description || undefined,
        type: lessonForm.type,
        videoUrl: lessonForm.videoUrl || undefined,
        videoDuration: lessonForm.videoDuration,
        content: lessonForm.content || undefined,
        isFree: lessonForm.isFree,
        isPublished: lessonForm.isPublished,
      };
      await updateLesson.mutateAsync({ id: lessonDialog.data.id, input });
    }
    setLessonDialog({ open: false, mode: "create" });
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    if (deleteDialog.type === "section") {
      await deleteSection.mutateAsync(deleteDialog.id);
    } else {
      await deleteLesson.mutateAsync(deleteDialog.id);
    }
    setDeleteDialog(null);
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/instructor/courses`);
  };

  const isLoading = courseLoading || sectionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {tCommon("error")}
          </h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {tCourses("courseNotFound")}
            </p>
            <Button className="mt-4" onClick={handleCancel}>
              {tCourses("backToCourses")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {course.title}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger
            value="details"
            className="flex items-center gap-2"
            asChild
          >
            <Link href={`/${locale}/dashboard/instructor/courses/${courseId}`}>
              <Settings className="h-4 w-4" />
              {tCourses("tabDetails")}
            </Link>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {tCourses("tabContent")}
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="flex items-center gap-2"
            asChild
          >
            <Link
              href={`/${locale}/dashboard/instructor/courses/${courseId}/students`}
            >
              <Users className="h-4 w-4" />
              {tCourses("tabStudents")}
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2"
            asChild
          >
            <Link
              href={`/${locale}/dashboard/instructor/courses/${courseId}/analytics`}
            >
              <BarChart className="h-4 w-4" />
              {tCourses("tabAnalytics")}
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{sections.length}</div>
                <p className="text-sm text-muted-foreground">
                  {t("totalSections")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {sections.reduce(
                    (acc, s) => acc + (s.lessons?.length || 0),
                    0,
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("totalLessons")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {(() => {
                    const totalSeconds = sections.reduce(
                      (acc, s) =>
                        acc +
                        (s.lessons?.reduce((a, l) => a + l.videoDuration, 0) ||
                          0),
                      0,
                    );
                    if (totalSeconds < 60) {
                      return `${totalSeconds} ${t("seconds")}`;
                    }
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    return seconds > 0
                      ? `${minutes} ${t("minutes")} ${seconds} ${t("seconds")}`
                      : `${minutes} ${t("minutes")}`;
                  })()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("totalDuration")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("curriculum")}</CardTitle>
              <Button onClick={() => handleOpenSectionDialog("create")}>
                <Plus className="h-4 w-4 mr-2" />
                {t("addSection")}
              </Button>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {t("noSections")}
                  </p>
                  <Button onClick={() => handleOpenSectionDialog("create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("addFirstSection")}
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSectionDragEnd}
                >
                  <SortableContext
                    items={sections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {sections.map((section, sectionIndex) => (
                        <SortableSectionItem
                          key={section.id}
                          section={section}
                          sectionIndex={sectionIndex}
                        >
                          {(dragHandleProps) => (
                            <SectionItem
                              section={section}
                              sectionIndex={sectionIndex}
                              expandedSections={expandedSections}
                              toggleSection={toggleSection}
                              handleOpenSectionDialog={handleOpenSectionDialog}
                              handleOpenLessonDialog={handleOpenLessonDialog}
                              setDeleteDialog={setDeleteDialog}
                              sensors={sensors}
                              handleLessonDragEnd={handleLessonDragEnd}
                              t={t}
                              tCommon={tCommon}
                              dragHandleProps={dragHandleProps}
                            />
                          )}
                        </SortableSectionItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section Dialog */}
      <Dialog
        open={sectionDialog.open}
        onOpenChange={(open) =>
          setSectionDialog({
            open,
            mode: sectionDialog.mode,
            data: sectionDialog.data,
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {sectionDialog.mode === "create"
                ? t("addSection")
                : t("editSection")}
            </DialogTitle>
            <DialogDescription>
              {sectionDialog.mode === "create"
                ? t("addSectionDescription")
                : t("editSectionDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-title">{t("sectionTitle")}</Label>
              <Input
                id="section-title"
                value={sectionForm.title}
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, title: e.target.value })
                }
                placeholder={t("sectionTitlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-description">
                {t("sectionDescription")}
              </Label>
              <Textarea
                id="section-description"
                value={sectionForm.description}
                onChange={(e) =>
                  setSectionForm({
                    ...sectionForm,
                    description: e.target.value,
                  })
                }
                placeholder={t("sectionDescriptionPlaceholder")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSectionDialog({ open: false, mode: "create" })}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSaveSection}
              disabled={
                !sectionForm.title ||
                createSection.isPending ||
                updateSection.isPending
              }
            >
              {(createSection.isPending || updateSection.isPending) && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog
        open={lessonDialog.open}
        onOpenChange={(open) =>
          setLessonDialog({
            open,
            mode: lessonDialog.mode,
            sectionId: lessonDialog.sectionId,
            data: lessonDialog.data,
          })
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {lessonDialog.mode === "create"
                ? t("addLesson")
                : t("editLesson")}
            </DialogTitle>
            <DialogDescription>
              {lessonDialog.mode === "create"
                ? t("addLessonDescription")
                : t("editLessonDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">{t("lessonTitle")}</Label>
              <Input
                id="lesson-title"
                value={lessonForm.title}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, title: e.target.value })
                }
                placeholder={t("lessonTitlePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-type">{t("lessonType")}</Label>
              <Select
                value={lessonForm.type}
                onValueChange={(value) =>
                  setLessonForm({
                    ...lessonForm,
                    type: value as
                      | "VIDEO"
                      | "TEXT"
                      | "QUIZ"
                      | "ASSIGNMENT"
                      | "LIVE",
                  })
                }
              >
                <SelectTrigger id="lesson-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      {t("lessonTypes.video")}
                    </div>
                  </SelectItem>
                  <SelectItem value="TEXT">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t("lessonTypes.text")}
                    </div>
                  </SelectItem>
                  <SelectItem value="QUIZ">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      {t("lessonTypes.quiz")}
                    </div>
                  </SelectItem>
                  <SelectItem value="ASSIGNMENT">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      {t("lessonTypes.assignment")}
                    </div>
                  </SelectItem>
                  <SelectItem value="LIVE">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      {t("lessonTypes.live")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-description">
                {t("lessonDescription")}
              </Label>
              <Textarea
                id="lesson-description"
                value={lessonForm.description}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, description: e.target.value })
                }
                placeholder={t("lessonDescriptionPlaceholder")}
                rows={3}
              />
            </div>

            {lessonForm.type === "VIDEO" && (
              <div className="space-y-2">
                <Label>{t("videoUrl")}</Label>
                <CourseMediaPicker
                  value={lessonForm.videoUrl}
                  onChange={(url) =>
                    setLessonForm({ ...lessonForm, videoUrl: url || "" })
                  }
                  onSelect={(media) =>
                    setLessonForm({
                      ...lessonForm,
                      videoUrl: media.url,
                      videoDuration: media.duration || 0,
                    })
                  }
                  accept="video/*"
                  placeholder={t("videoUrlPlaceholder")}
                  courseTitle={course?.title}
                />
              </div>
            )}

            {lessonForm.type === "TEXT" && (
              <div className="space-y-2">
                <Label>{t("lessonContent")}</Label>
                <RichTextEditor
                  value={lessonForm.content}
                  onChange={(html) =>
                    setLessonForm({ ...lessonForm, content: html })
                  }
                  placeholder={t("lessonContentPlaceholder")}
                  className="min-h-[200px]"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  id="lesson-free"
                  checked={lessonForm.isFree}
                  onCheckedChange={(checked) =>
                    setLessonForm({ ...lessonForm, isFree: checked })
                  }
                />
                <Label htmlFor="lesson-free">{t("freePreview")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="lesson-published"
                  checked={lessonForm.isPublished}
                  onCheckedChange={(checked) =>
                    setLessonForm({ ...lessonForm, isPublished: checked })
                  }
                />
                <Label htmlFor="lesson-published">{t("published")}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLessonDialog({ open: false, mode: "create" })}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSaveLesson}
              disabled={
                !lessonForm.title ||
                createLesson.isPending ||
                updateLesson.isPending
              }
            >
              {(createLesson.isPending || updateLesson.isPending) && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog?.open}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === "section"
                ? t("deleteSectionConfirm", {
                    title: deleteDialog?.title || "",
                  })
                : t("deleteLessonConfirm", {
                    title: deleteDialog?.title || "",
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {(deleteSection.isPending || deleteLesson.isPending) && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
