"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, FolderPlus, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MediaCard,
  MediaUploadDialog,
  MediaEditDialog,
  MediaDeleteDialog,
  FolderCard,
  FolderDialog,
  FolderDeleteDialog,
  FolderTree,
} from "@/features/media/components";
import { useMedia } from "@/features/media/hooks/use-media";
import { useFolders } from "@/features/media/hooks/use-folders";
import { MediaResponse, MediaFolderResponse } from "@/features/media/schemas";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import { Search } from "lucide-react";

const MediaPage = () => {
  const { hasPermission: hasViewPermission, loading: permissionsLoading } = useHasPermission("media.view");
  const { hasPermission: hasUploadPermission } = useHasPermission("media.upload");
  const { hasPermission: hasEditPermission } = useHasPermission("media.edit");
  const { hasPermission: hasDeletePermission } = useHasPermission("media.delete");
  const { hasPermission: hasManagePermission } = useHasPermission("media.manage");

  const tCommon = useTranslations("common");
  const t = useTranslations("media");

  const [search, setSearch] = useState("");
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaResponse | null>(null);
  const [deletingMedia, setDeletingMedia] = useState<MediaResponse | null>(null);

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderDialogParentId, setFolderDialogParentId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<MediaFolderResponse | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<MediaFolderResponse | null>(null);

  // Fetch ALL folders for tree view (no filter)
  const { data: allFoldersData } = useFolders();
  const allFolders = allFoldersData || [];

  // Fetch folders in current directory
  const { data: currentFoldersData } = useFolders({ parentId: currentFolderId });
  const currentFolders = currentFoldersData || [];

  // Fetch media with React Query
  const { data, isLoading } = useMedia(
    {
      page,
      limit: 20,
      search,
      mimeType: mimeTypeFilter,
      folderId: currentFolderId,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      enabled: hasViewPermission,
    }
  );

  const handleFolderClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setPage(1);
  };

  const handleCreateFolder = (parentId: string | null) => {
    setFolderDialogParentId(parentId);
    setEditingFolder(null);
    setIsFolderDialogOpen(true);
  };

  const handleEditFolder = (folder: MediaFolderResponse) => {
    setEditingFolder(folder);
    setFolderDialogParentId(folder.parentId || null);
    setIsFolderDialogOpen(true);
  };

  // Check permission
  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  // Show access denied if no permission
  if (!hasViewPermission) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{tCommon("accessDenied")}</h2>
          <p className="text-muted-foreground mt-2">
            {tCommon("noPermission")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-6">
      {/* Sidebar - Folder Tree */}
      <div className="w-64 shrink-0">
        <FolderTree
          folders={allFolders}
          currentFolderId={currentFolderId}
          onFolderClick={handleFolderClick}
          onCreateFolder={hasManagePermission ? handleCreateFolder : undefined}
          onEditFolder={hasManagePermission ? handleEditFolder : undefined}
          onDeleteFolder={hasManagePermission ? setDeletingFolder : undefined}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <div className="flex gap-2">
            {hasManagePermission && (
              <Button 
                onClick={() => handleCreateFolder(currentFolderId)} 
                size="lg"
                variant="outline"
              >
                <FolderPlus className="mr-2 h-5 w-5" />
                {t("newFolder")}
              </Button>
            )}
            {hasUploadPermission && (
              <Button onClick={() => setIsUploadDialogOpen(true)} size="lg">
                <Upload className="mr-2 h-5 w-5" />
                {t("addNew")}
              </Button>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        {currentFolderId && (
          <div className="flex items-center gap-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFolderClick(null)}
              className="h-8 px-2"
            >
              <Home className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {allFolders.find(f => f.id === currentFolderId)?.name || "..."}
            </span>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-4 bg-card rounded-lg border p-4">
          <Tabs
            defaultValue="all"
            className="flex-1"
            onValueChange={(value) => {
              if (value === "all") setMimeTypeFilter(undefined);
              else if (value === "images") setMimeTypeFilter("image/");
              else if (value === "videos") setMimeTypeFilter("video/");
              else if (value === "documents") setMimeTypeFilter("application/");
            }}
          >
            <TabsList className="h-10">
              <TabsTrigger value="all" className="px-4">
                {t("filters.all")}
              </TabsTrigger>
              <TabsTrigger value="images" className="px-4">
                {t("filters.images")}
              </TabsTrigger>
              <TabsTrigger value="videos" className="px-4">
                {t("filters.videos")}
              </TabsTrigger>
              <TabsTrigger value="documents" className="px-4">
                {t("filters.documents")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 bg-card rounded-lg border p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">{tCommon("loading")}</p>
              </div>
            </div>
          ) : currentFolders.length > 0 || (data?.data && data.data.length > 0) ? (
            <>
              {/* Stats */}
              <div className="mb-6 text-sm text-muted-foreground">
                {currentFolders.length > 0 && `${currentFolders.length} folder(s)`}
                {currentFolders.length > 0 && data?.data && data.data.length > 0 && " • "}
                {data?.data && data.data.length > 0 && `${data.meta.total} file(s)`}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {/* Folders first */}
                {currentFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onOpen={() => handleFolderClick(folder.id)}
                    onEdit={hasManagePermission ? handleEditFolder : undefined}
                    onDelete={hasManagePermission ? setDeletingFolder : undefined}
                  />
                ))}

                {/* Then media files */}
                {data?.data && data.data.map((media) => (
                  <MediaCard
                    key={media.id}
                    media={media}
                    onEdit={hasEditPermission ? setEditingMedia : undefined}
                    onDelete={hasDeletePermission ? setDeletingMedia : undefined}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {page} of {data.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                    disabled={page === data.meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-24">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{t("noResults")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasUploadPermission && "Upload your first media file to get started"}
                  </p>
                </div>
                {hasUploadPermission && (
                  <Button 
                    onClick={() => setIsUploadDialogOpen(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t("addNew")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <MediaUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        currentFolderId={currentFolderId}
      />

      <MediaEditDialog
        open={!!editingMedia}
        onOpenChange={(open) => !open && setEditingMedia(null)}
        media={editingMedia}
      />

      <MediaDeleteDialog
        open={!!deletingMedia}
        onOpenChange={(open) => !open && setDeletingMedia(null)}
        media={deletingMedia}
      />

      <FolderDialog
        open={isFolderDialogOpen}
        onOpenChange={(open) => {
          setIsFolderDialogOpen(open);
          if (!open) {
            setEditingFolder(null);
            setFolderDialogParentId(null);
          }
        }}
        folder={editingFolder}
        parentId={folderDialogParentId}
      />

      <FolderDeleteDialog
        open={!!deletingFolder}
        onOpenChange={(open) => !open && setDeletingFolder(null)}
        folder={deletingFolder}
      />
    </div>
  );
};

export default MediaPage;
