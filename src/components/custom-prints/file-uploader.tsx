"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  UploadCloud,
  FileCode,
  Box,
  ImageIcon,
  X,
  AlertCircle,
  Eye,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { STLViewer } from "./stl-viewer";
import { useTranslation } from "@/lib/i18n/context";
import {
  validateCustomPrintFile,
  MAX_PRINT_FILE_SIZE_BYTES,
} from "@/lib/validations/custom-print";
import { cn } from "@/lib/utils";

export interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUploader({
  files,
  onFilesChange,
  maxFiles = 5,
  disabled = false,
  className,
}: FileUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspecting file state for 3D viewer or image zoom
  const [inspectingFile, setInspectingFile] = useState<File | null>(null);

  const handleAddFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(newFiles);

      if (files.length + incoming.length > maxFiles) {
        setError(`You can upload a maximum of ${maxFiles} files per request.`);
        return;
      }

      const validFiles: File[] = [];

      for (const f of incoming) {
        const validation = validateCustomPrintFile(f);
        if (!validation.valid) {
          setError(validation.error || "Invalid file format or size.");
          return;
        }
        validFiles.push(f);
      }

      onFilesChange([...files, ...validFiles]);
    },
    [files, maxFiles, onFilesChange]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, idx) => idx !== index));
  };

  const isStl = (f: File) => f.name.toLowerCase().endsWith(".stl");
  const is3mf = (f: File) => f.name.toLowerCase().endsWith(".3mf");
  const isImage = (f: File) =>
    f.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(f.name);

  return (
    <div className={cn("space-y-4 text-left", className)}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".stl,.3mf,.png,.jpg,.jpeg,.webp,model/stl,model/3mf,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
        }}
        disabled={disabled}
        className="hidden"
      />

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs animate-in fade-in"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Drop Area */}
      {files.length < maxFiles && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center gap-3",
            disabled && "opacity-50 cursor-not-allowed",
            isDragging
              ? "border-[#FF6B35] bg-[#FF6B35]/10 scale-[1.01]"
              : "border-border/80 hover:border-[#FF6B35]/70 bg-muted/10 hover:bg-muted/20"
          )}
        >
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl transition-all shadow-xs",
              isDragging
                ? "bg-[#FF6B35] text-white"
                : "bg-muted text-muted-foreground group-hover:text-[#FF6B35] group-hover:bg-[#FF6B35]/10"
            )}
          >
            <UploadCloud className="size-7" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {isDragging
                ? t("customPrintApp.dropzoneTitle")
                : t("customPrintApp.dropzoneTitle")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("customPrintApp.dropzoneHint")}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="mt-1 pointer-events-none font-semibold"
          >
            {t("customPrintApp.browseFiles")}
          </Button>
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            {t("customPrintApp.attachedFiles")} ({files.length}/{maxFiles})
          </span>

          <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card overflow-hidden">
            {files.map((f, idx) => {
              const fileIsStl = isStl(f);
              const fileIs3mf = is3mf(f);
              const fileIsImg = isImage(f);

              return (
                <div
                  key={`${f.name}-${idx}`}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl shrink-0 shadow-xs",
                        fileIsStl
                          ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                          : fileIs3mf
                          ? "bg-indigo-500/10 text-indigo-500"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {fileIsStl ? (
                        <Box className="size-5" />
                      ) : fileIs3mf ? (
                        <FileCode className="size-5" />
                      ) : (
                        <ImageIcon className="size-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate max-w-xs sm:max-w-md">
                        {f.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {(f.size / (1024 * 1024)).toFixed(2)} MB
                        {fileIsStl && " · 3D Mesh (STL)"}
                        {fileIs3mf && " · Multi-Part Slicing Data (3MF)"}
                        {fileIsImg && " · Visual Reference"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* STL 3D Preview Trigger */}
                    {fileIsStl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectingFile(f)}
                        className="h-8 px-2.5 text-xs text-[#FF6B35] hover:text-[#FF6B35]/80 hover:bg-[#FF6B35]/10 border-[#FF6B35]/30 font-semibold"
                        iconLeft={<Box className="size-3.5" />}
                      >
                        {t("customPrintApp.previewSTL")}
                      </Button>
                    )}

                    {/* Image Preview Trigger */}
                    {fileIsImg && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectingFile(f)}
                        className="h-8 px-2.5 text-xs font-semibold"
                        iconLeft={<Eye className="size-3.5" />}
                      >
                        {t("customPrintApp.previewImage")}
                      </Button>
                    )}

                    {/* 3MF Info Badge */}
                    {fileIs3mf && (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-2 font-mono text-indigo-500 border-indigo-500/30"
                      >
                        Native 3MF
                      </Badge>
                    )}

                    {/* Remove File Button */}
                    {!disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(idx)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                        title="Remove file"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for 3D STL Inspection or Image Preview */}
      {inspectingFile && (
        <Modal
          open={Boolean(inspectingFile)}
          onClose={() => setInspectingFile(null)}
          title={inspectingFile.name}
          maxWidth="2xl"
        >
          <div className="space-y-3 pt-1">
            {isStl(inspectingFile) ? (
              <>
                <STLViewer file={inspectingFile} height={420} />
                <p className="text-[11px] text-muted-foreground text-center">
                  {t("customPrintApp.stlInspectionHint")}
                </p>
              </>
            ) : isImage(inspectingFile) ? (
              <div className="relative h-[65vh] w-full bg-muted/20 rounded-2xl overflow-hidden">
                <Image
                  src={URL.createObjectURL(inspectingFile)}
                  alt={inspectingFile.name}
                  fill
                  sizes="1000px"
                  className="object-contain"
                />
              </div>
            ) : null}
          </div>
        </Modal>
      )}
    </div>
  );
}

