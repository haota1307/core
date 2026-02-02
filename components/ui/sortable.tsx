"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableItem({ id, children, className }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50 z-50", className)}
    >
      {children}
    </div>
  );
}

interface DragHandleProps {
  id: string;
  className?: string;
}

export function DragHandle({ id, className }: DragHandleProps) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <button
      className={cn("cursor-grab active:cursor-grabbing touch-none", className)}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
