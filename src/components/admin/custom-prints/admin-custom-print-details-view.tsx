"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileCode,
  Download,
  ExternalLink,
  Plus,
  Box,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calculator,
  User,
  Eye,
  Ban,
} from "lucide-react";
import { CreateQuoteModal } from "./create-quote-modal";
import { RejectRequestModal } from "./reject-request-modal";
import { STLViewer } from "@/components/custom-prints/stl-viewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface AdminCustomPrintDetailsViewProps {
  requestId: string;
}

export function AdminCustomPrintDetailsView({
  requestId,
}: AdminCustomPrintDetailsViewProps) {
  const { t, isRTL } = useTranslation();
  const [request, setRequest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const fetchRequest = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/custom-prints/${requestId}`);
      if (!res.ok) throw new Error("Custom print not found");
      const json = await res.json();
      if (json.success && json.data) {
        const reqData = json.data.request;
        setRequest(reqData);

        // Find primary STL file to select by default
        const stlFile = reqData.files?.find((f: any) =>
          f.original_filename?.toLowerCase().endsWith(".stl")
        );
        if (stlFile) {
          setSelectedFileId(stlFile.id);
        } else if (reqData.files?.[0]) {
          setSelectedFileId(reqData.files[0].id);
        }

        // Fetch signed URLs for all files
        if (reqData.files) {
          const urlMap: Record<string, string> = {};
          await Promise.all(
            reqData.files.map(async (file: any) => {
              try {
                const urlRes = await fetch(
                  `/api/custom-prints/${requestId}/files/${file.id}/preview-url`
                );
                if (urlRes.ok) {
                  const urlJson = await urlRes.json();
                  const signedUrl =
                    urlJson.data?.signed_url || urlJson.data?.preview_url;
                  if (urlJson.success && signedUrl) {
                    urlMap[file.id] = signedUrl;
                  }
                }
              } catch {
                // Silently ignore individual file signed url failure
              }
            })
          );
          setFileUrls(urlMap);
        }
      }
    } catch (err) {
      toast.error("Error", "Could not load custom print request details");
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-xl w-48" />
        <div className="h-96 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border border-border">
        <h2 className="text-base font-bold text-foreground">
          Request Not Found
        </h2>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/admin/custom-prints">
            <ArrowLeft className="size-4 me-1.5" />
            Back to Custom Prints
          </Link>
        </Button>
      </div>
    );
  }

  const selectedFile = request.files?.find((f: any) => f.id === selectedFileId);
  const selectedFileUrl = selectedFileId ? fileUrls[selectedFileId] : null;
  const isStl =
    selectedFile?.original_filename?.toLowerCase().endsWith(".stl");
  const isImage =
    selectedFile?.mime_type?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(selectedFile?.original_filename || "");

  const quotes = request.quotes || [];
  const isRejected = request.status === "rejected";
  const isTerminalStatus = ["rejected", "completed", "cancelled"].includes(
    request.status
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-2.5 text-xs"
          >
            <Link href="/admin/custom-prints">
              <ArrowLeft className="size-4 me-1" />
              Custom Prints
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-foreground">
                {request.title}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase",
                  request.status === "submitted" &&
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                  request.status === "quote_sent" &&
                    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                  request.status === "accepted" &&
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                  request.status === "in_production" &&
                    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
                  request.status === "completed" &&
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  request.status === "rejected" &&
                    "bg-red-500/10 text-red-500 border border-red-500/20",
                  request.status === "cancelled" &&
                    "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                )}
              >
                {request.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Ref: {request.id} • Submitted on{" "}
              {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isTerminalStatus && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRejectModalOpen(true)}
              className="text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs h-9"
            >
              <Ban className="size-3.5 me-1.5" />
              {t("admin.customPrintsModule.rejectRequest")}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsQuoteModalOpen(true)}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-xs h-9 shadow-sm"
          >
            <Calculator className="size-3.5 me-1.5" />
            {t("admin.customPrintsModule.createQuote")}
          </Button>
        </div>
      </div>

      {/* Rejection reason banner (admin view) */}
      {isRejected && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {t("admin.customPrintsModule.rejectionReasonLabel")}
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {request.rejection_reason || "—"}
            </p>
            {request.rejected_at && (
              <p className="text-[10px] font-mono text-muted-foreground">
                {new Date(request.rejected_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Layout: 3D Model Inspection + Parameters & Quote History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 3D Viewer & Attached Files */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive CAD Preview Canvas */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="size-4 text-[#FF6B35]" />
                <h2 className="text-sm font-heading font-bold text-foreground">
                  3D Model Inspection
                </h2>
              </div>
              {selectedFile && (
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                  {selectedFile.original_filename}
                </span>
              )}
            </div>

            <div className="min-h-[380px] bg-black/95 flex items-center justify-center relative">
              {isStl && selectedFileUrl ? (
                <STLViewer
                  url={selectedFileUrl}
                  height={380}
                  color="#FF6B35"
                  className="w-full"
                />
              ) : isImage && selectedFileUrl ? (
                <div className="p-4 flex items-center justify-center max-h-[380px]">
                  <img
                    src={selectedFileUrl}
                    alt="Reference sketch"
                    className="max-h-[360px] max-w-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="text-center p-8 space-y-2 text-gray-400">
                  <FileCode className="size-10 mx-auto text-gray-500" />
                  <p className="text-xs">
                    {selectedFile
                      ? `Preview not available for ${selectedFile.original_filename}. Download file to inspect.`
                      : "No CAD file selected for inspection."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attached Files List */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <FileCode className="size-4 text-[#FF6B35]" />
              <span>{t("admin.customPrintsModule.files")}</span>
            </h2>

            <div className="divide-y divide-border/60">
              {request.files?.map((file: any) => {
                const downloadUrl = fileUrls[file.id];
                const active = file.id === selectedFileId;
                const sizeKb = file.file_size_bytes
                  ? (file.file_size_bytes / 1024).toFixed(1) + " KB"
                  : "—";

                return (
                  <div
                    key={file.id}
                    className={cn(
                      "py-3 flex items-center justify-between gap-3 text-xs transition-colors rounded-xl px-2",
                      active && "bg-muted/60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileCode className="size-4 text-[#FF6B35] shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-foreground block truncate">
                          {file.original_filename}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {sizeKb} • {file.mime_type || "cad/mesh"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedFileId(file.id)}
                        className={cn(
                          "h-7 px-2.5 text-[11px]",
                          active && "bg-[#FF6B35] text-white"
                        )}
                      >
                        <Eye className="size-3 me-1" />
                        Preview
                      </Button>

                      {downloadUrl && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-[11px]"
                        >
                          <a
                            href={downloadUrl}
                            download={file.original_filename}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="size-3 me-1" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Specifications & Quotes History */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <User className="size-4 text-[#FF6B35]" />
              Customer
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60 gap-3">
                <span className="text-muted-foreground shrink-0">Name:</span>
                <span className="font-bold text-foreground truncate text-end">
                  {[request.profile?.first_name, request.profile?.last_name]
                    .filter(Boolean)
                    .join(" ") || "Guest"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60 gap-3">
                <span className="text-muted-foreground shrink-0">Email:</span>
                <span className="font-mono text-foreground truncate text-end">
                  {request.profile?.email || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60 gap-3">
                <span className="text-muted-foreground shrink-0">Phone:</span>
                <span className="font-mono text-foreground truncate text-end">
                  {request.profile?.phone || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Client Specs Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-heading font-bold text-foreground">
              {t("admin.customPrintsModule.clientNotes")}
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Requested Qty:</span>
                <span className="font-bold font-mono text-foreground">
                  {request.quantity} units
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Preferred Material:</span>
                <span className="font-bold font-mono text-foreground">
                  {request.preferred_material || "Flexible / Studio Choice"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Preferred Color:</span>
                <span className="font-bold font-mono text-foreground">
                  {request.preferred_color || "Any Available"}
                </span>
              </div>
            </div>

            {request.description && (
              <div className="pt-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">
                  Customer Description / Requirements
                </span>
                <p className="p-3 rounded-xl bg-muted/40 text-xs text-foreground leading-relaxed">
                  {request.description}
                </p>
              </div>
            )}

            {request.customer_notes && (
              <div className="pt-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">
                  Special Notes
                </span>
                <p className="p-3 rounded-xl bg-muted/40 text-xs text-foreground leading-relaxed italic">
                  &ldquo;{request.customer_notes}&rdquo;
                </p>
              </div>
            )}

            {request.reference_url && (
              <div className="pt-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">
                  Reference Link
                </span>
                <a
                  href={request.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#FF6B35] font-mono text-xs hover:underline"
                >
                  <span className="truncate">{request.reference_url}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Quotes History Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-heading font-bold text-foreground">
                Quotes History
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground">
                {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
              </span>
            </div>

            {quotes.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground rounded-xl bg-muted/30 border border-dashed border-border">
                No quotes generated yet. Click &quot;Issue Official Quote&quot; to formulate the engineering quote.
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((q: any) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl border border-border bg-background space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground font-mono">
                        Quote Version {q.version}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                          q.status === "accepted" &&
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                          q.status === "sent" &&
                            "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          q.status === "draft" &&
                            "bg-muted text-muted-foreground",
                          q.status === "rejected" && "bg-red-500/10 text-red-500"
                        )}
                      >
                        {q.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline font-mono">
                      <span className="text-muted-foreground">
                        {q.quantity}x @ {q.unit_price} EGP
                      </span>
                      <span className="text-sm font-bold text-[#FF6B35]">
                        {Number(q.total_price).toFixed(2)} EGP
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {q.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px] font-mono text-muted-foreground">
                      <span>Lead Time: ~{q.estimated_days} days</span>
                      {q.valid_until && (
                        <span>
                          Valid until:{" "}
                          {new Date(q.valid_until).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Quote Modal */}
      <CreateQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        onSuccess={fetchRequest}
        request={request}
      />
      <RejectRequestModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSuccess={fetchRequest}
        request={request}
      />
    </div>
  );
}

