"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Home,
  MoreHorizontal,
  Edit,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MediaFolderResponse } from "../schemas";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FolderTreeProps {
  folders: MediaFolderResponse[];
  currentFolderId: string | null;
  onFolderClick: (folderId: string | null) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onEditFolder?: (folder: MediaFolderResponse) => void;
  onDeleteFolder?: (folder: MediaFolderResponse) => void;
  onMediaDrop?: (draggedItem: any, targetFolderId: string | null) => void;
}

interface FolderNodeProps {
  folder: MediaFolderResponse;
  level: number;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  onCreateSubfolder?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDrop?: (draggedItem: any, targetFolderId: string) => void;
}

function FolderNode({
  folder,
  level,
  isActive,
  isExpanded,
  onToggle,
  onClick,
  onCreateSubfolder,
  onEdit,
  onDelete,
  onDrop,
}: FolderNodeProps) {
  const tCommon = useTranslations("common");
  const hasChildren = folder._count.children > 0;
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "folder" && data.id === folder.id) {
        return; // Don't drop on itself
      }
      onDrop?.(data, folder.id);
    } catch (error) {
      console.error("Drop error:", error);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
          isActive && "bg-accent font-medium",
          isDragOver && "bg-primary/20 ring-2 ring-primary"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="h-4 w-4" />
        )}

        {/* Folder icon */}
        <div onClick={onClick} className="flex flex-1 items-center gap-2 min-w-0">
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0 text-primary" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0 text-primary" />
          )}
          <span className="truncate flex-1">{folder.name}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {folder._count.media}
          </span>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onCreateSubfolder && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateSubfolder();
                }}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                {tCommon("createSubfolder")}
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                {tCommon("edit")}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tCommon("delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function FolderTree({
  folders,
  currentFolderId,
  onFolderClick,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMediaDrop,
}: FolderTreeProps) {
  const t = useTranslations("media.folder");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Expand all folders on initial load
  useEffect(() => {
    if (!initialized && folders.length > 0) {
      const allFolderIds = new Set(folders.map(f => f.id));
      setExpandedFolders(allFolderIds);
      setInitialized(true);
    }
  }, [folders, initialized]);

  // Auto-expand parent folders when currentFolderId changes
  useEffect(() => {
    if (currentFolderId) {
      const parentsToExpand = new Set<string>();
      
      // Find all parent folders of current folder
      const findParents = (folderId: string) => {
        const folder = folders.find(f => f.id === folderId);
        if (folder?.parentId) {
          parentsToExpand.add(folder.parentId);
          findParents(folder.parentId);
        }
      };
      
      findParents(currentFolderId);
      
      if (parentsToExpand.size > 0) {
        setExpandedFolders(prev => {
          const next = new Set(prev);
          parentsToExpand.forEach(id => next.add(id));
          return next;
        });
      }
    }
  }, [currentFolderId, folders]);

  // Build folder hierarchy
  const folderMap = new Map<string, MediaFolderResponse>();
  const rootFolders: MediaFolderResponse[] = [];

  folders.forEach((folder) => {
    folderMap.set(folder.id, folder);
  });

  folders.forEach((folder) => {
    if (!folder.parentId) {
      rootFolders.push(folder);
    }
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFolder = (folder: MediaFolderResponse, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = currentFolderId === folder.id;
    const children = folders.filter((f) => f.parentId === folder.id);

    return (
      <div key={folder.id}>
        <FolderNode
          folder={folder}
          level={level}
          isActive={isActive}
          isExpanded={isExpanded}
          onToggle={() => toggleFolder(folder.id)}
          onClick={() => onFolderClick(folder.id)}
          onDrop={onMediaDrop}
          onCreateSubfolder={
            onCreateFolder ? () => onCreateFolder(folder.id) : undefined
          }
          onEdit={onEditFolder ? () => onEditFolder(folder) : undefined}
          onDelete={onDeleteFolder ? () => onDeleteFolder(folder) : undefined}
        />
        {isExpanded && children.length > 0 && (
          <div>{children.map((child) => renderFolder(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Root folder */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
              currentFolderId === null && "bg-accent font-medium"
            )}
            onClick={() => onFolderClick(null)}
          >
            <Home className="h-4 w-4 text-primary" />
            <span className="flex-1">{t("root")}</span>
            {onCreateFolder && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFolder(null);
                }}
              >
                <FolderPlus className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Folder tree */}
          {rootFolders.map((folder) => renderFolder(folder))}
        </div>
      </ScrollArea>
    </div>
  );
}

