import { NextResponse } from "next/server";

import {
  createDocumentAccessUrl,
  uploadUniversityLogoFile,
} from "@/lib/supabase/storage";

const ACCEPTED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Yükləmək üçün logo faylı seçin." },
        { status: 400 },
      );
    }

    if (!ACCEPTED_LOGO_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "PNG, JPG və ya WebP logo yükləyin." },
        { status: 400 },
      );
    }

    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json(
        { message: "Logo faylı 2 MB və ya daha kiçik olmalıdır." },
        { status: 400 },
      );
    }

    const uploadedFile = await uploadUniversityLogoFile({ file });
    const accessUrl = await createDocumentAccessUrl(uploadedFile.fileUrl);

    return NextResponse.json({
      accessUrl,
      fileName: uploadedFile.fileName,
      fileUrl: uploadedFile.fileUrl,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Logo upload failed: ${String(error)}`);
    }

    return NextResponse.json(
      { message: "Logo yüklənmədi. Yenidən cəhd edin." },
      { status: 500 },
    );
  }
}
