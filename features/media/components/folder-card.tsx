"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Folder,
  MoreHorizontal, 
  Edit, 
  Trash2,
  FolderOpen,
  FolderInput
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    _count?: {
      media: number;
    };
  };
  onOpen?: (folderId: string) => void;
  onEdit?: (folder: any) => void;
  onMove?: (folder: any) => void;
  onDelete?: (folder: any) => void;
  selected?: boolean;
}

export function FolderCard({
  folder,
  onOpen,
  onEdit,
  onMove,
  onDelete,
  selected = false,
}: FolderCardProps) {
  const t = useTranslations("media");
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(folder);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(folder);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!onMove) return;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({
      type: "folder",
      id: folder.id,
      name: folder.name,
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      
      // Don't allow dropping folder into itself
      if (data.type === "folder" && data.id === folder.id) {
        return;
      }

      // Emit drop event to parent
      const dropEvent = new CustomEvent("mediaDrop", {
        detail: {
          draggedItem: data,
          targetFolderId: folder.id,
        },
        bubbles: true,
      });
      e.currentTarget.dispatchEvent(dropEvent);
    } catch (error) {
      console.error("Drop error:", error);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center p-3 rounded-lg transition-all",
        "hover:bg-accent/50 cursor-pointer",
        selected && "bg-accent ring-2 ring-primary",
        isDragging && "opacity-50",
        isDragOver && "ring-2 ring-primary bg-primary/10"
      )}
      onClick={() => onOpen?.(folder.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!!onMove}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Folder Icon */}
      <div className="relative w-full aspect-square mb-2 rounded-md flex items-center justify-center">
        {isHovered ? (
          <FolderOpen className="h-16 w-16 text-yellow-500" />
        ) : (
          <Folder className="h-16 w-16 text-yellow-500" />
        )}
        
        {/* Item count badge */}
        {folder._count && folder._count.media > 0 && (
          <div className="absolute bottom-1 right-1 bg-background/90 px-2 py-0.5 rounded-full text-xs font-medium">
            {folder._count.media}
          </div>
        )}
      </div>

      {/* Folder name */}
      <div className="w-full text-center px-1">
        <p 
          className="text-sm font-medium truncate" 
          title={folder.name}
        >
          {folder.name}
        </p>
      </div>

      {/* Context menu */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-7 w-7 shadow-md"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onEdit && (
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
            )}
            {onMove && (
              <DropdownMenuItem onClick={() => onMove(folder)}>
                <FolderInput className="mr-2 h-4 w-4" />
                Move
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

