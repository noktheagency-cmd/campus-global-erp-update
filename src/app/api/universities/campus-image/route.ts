import { NextResponse } from "next/server";

import {
  createDocumentAccessUrl,
  uploadCampusImageFile,
} from "@/lib/supabase/storage";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const universityId = formData.get("universityId");

    if (typeof universityId !== "string" || !universityId.trim()) {
      return NextResponse.json(
        { message: "Kampus sekli ucun universitet secimi tapilmadi." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Yuklemek ucun kampus sekli secin." },
        { status: 400 },
      );
    }

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "PNG, JPG ve ya WebP kampus sekli yukleyin." },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { message: "Kampus sekli 4 MB ve ya daha kicik olmalidir." },
        { status: 400 },
      );
    }

    const uploadedFile = await uploadCampusImageFile({
      file,
      universityId: universityId.trim(),
    });
    const accessUrl = await createDocumentAccessUrl(uploadedFile.fileUrl);

    return NextResponse.json({
      accessUrl,
      fileName: uploadedFile.fileName,
      fileUrl: uploadedFile.fileUrl,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Campus image upload failed: ${String(error)}`);
    }

    return NextResponse.json(
      { message: "Kampus sekli yuklenmedi. Yeniden cehd edin." },
      { status: 500 },
    );
  }
}
