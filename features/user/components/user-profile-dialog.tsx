"use client";

import { useTranslations } from "next-intl";
import { User, Mail, Shield, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { UserResponse } from "../schemas";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse;
}

export function UserProfileDialog({
  open,
  onOpenChange,
  user,
}: UserProfileDialogProps) {
  const t = useTranslations("nav.user.profileDialog");

  // Get user initials for avatar fallback
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || user.email}
              />
              <AvatarFallback className="text-lg">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold">
                {user.name || t("noName")}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.role && (
                <Badge variant="secondary" className="mt-1">
                  <Shield className="mr-1 h-3 w-3" />
                  {user.role.name}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* User Details */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{t("nameLabel")}</p>
                  <p className="text-muted-foreground">
                    {user.name || t("noName")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{t("emailLabel")}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {user.role && (
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{t("roleLabel")}</p>
                    <p className="text-muted-foreground">{user.role.name}</p>
                    {user.role.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {user.role.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{t("userIdLabel")}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {user.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
