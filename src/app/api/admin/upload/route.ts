import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.authorized) {
      return adminAuth.response;
    }

    const { supabase } = adminAuth;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = (formData.get("product_id") as string | null)?.trim();

    if (!file || typeof file === "string") {
      return NextResponse.json(
        {
          success: false,
          error: "No file uploaded. Please provide a valid 'file' form field.",
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type '${file.type}'. Allowed types are: ${Array.from(
            ALLOWED_MIME_TYPES
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the 5MB limit. Uploaded size: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // Sanitize extension
    const originalName = file.name || "image.jpg";
    const rawExt = originalName.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedExt = /^[a-z0-9]+$/.test(rawExt) ? rawExt : "jpg";

    const uniqueId = crypto.randomUUID();
    const timestamp = Date.now();
    const storagePath = productId
      ? `products/${productId}/${timestamp}-${uniqueId}.${sanitizedExt}`
      : `uploads/${timestamp}-${uniqueId}.${sanitizedExt}`;

    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          success: false,
          error: `Storage upload failed: ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(storagePath);

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully to Supabase Storage",
        data: {
          public_url: publicUrl,
          storage_path: storagePath,
          bucket: "product-images",
          file_name: originalName,
          size: file.size,
          mime_type: file.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

