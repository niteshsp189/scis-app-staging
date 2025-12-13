import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Camera, Upload, Trash2, X, Check } from "lucide-react";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName: string;
  userInitials: string;
  size?: "sm" | "md" | "lg";
  showEditButton?: boolean;
}

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  userInitials,
  size = "md",
  showEditButton = true,
}: AvatarUploadProps) {
  const { uploadAvatar, deleteAvatar, isLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-32 w-32",
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const success = await uploadAvatar(selectedFile);
      if (success) {
        setIsDialogOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Avatar upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const success = await deleteAvatar();
      if (success) {
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Avatar deletion failed:", error);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = (): string => {
    return userInitials || "U";
  };

  const getAvatarUrl = (url?: string): string => {
    if (!url) return "";
    // Add cache-busting parameter to prevent browser caching issues
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  };

  return (
    <div className="relative">
      <Avatar className={`${sizeClasses[size]} border-2 border-gray-200`}>
        <AvatarImage src={getAvatarUrl(currentAvatarUrl)} alt={userName} />
        <AvatarFallback className="text-lg font-semibold">
          {getInitials()}
        </AvatarFallback>
      </Avatar>

      {showEditButton && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white shadow-md hover:shadow-lg"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Profile Photo</DialogTitle>
              <DialogDescription>
                Choose a new profile photo or remove your current one.
              </DialogDescription>
            </DialogHeader>

              <div className="space-y-6">
                {/* Current/Preview Avatar */}
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24 border-4 border-gray-200">
                    <AvatarImage
                      src={previewUrl || getAvatarUrl(currentAvatarUrl)}
                      alt={userName}
                    />
                    <AvatarFallback className="text-xl font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="avatar-upload">Choose Photo</Label>
                <Input
                  id="avatar-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500">
                  JPEG, PNG, or GIF. Maximum 2MB.
                </p>
              </div>

              {/* Upload Preview Actions */}
              {selectedFile && (
                <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2 w-full">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading || isLoading}
                >
                  Cancel
                </Button>

                {currentAvatarUrl && (
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={isUploading || isLoading}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}

                {selectedFile && (
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || isLoading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}