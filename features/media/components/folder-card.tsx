"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Folder,
  MoreHorizontal, 
  Edit, 
  Trash2,
  FolderOpen
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
  onDelete?: (folder: any) => void;
  selected?: boolean;
}

export function FolderCard({
  folder,
  onOpen,
  onEdit,
  onDelete,
  selected = false,
}: FolderCardProps) {
  const t = useTranslations("media");
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(folder);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(folder);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center p-3 rounded-lg transition-all",
        "hover:bg-accent/50 cursor-pointer",
        selected && "bg-accent ring-2 ring-primary"
      )}
      onClick={() => onOpen?.(folder.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

