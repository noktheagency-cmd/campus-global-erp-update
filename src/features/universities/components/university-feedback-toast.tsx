"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const successMessages: Record<string, string> = {
  "campus-archived": "Kampus arxivləndi.",
  "campus-created": "Kampus əlavə edildi.",
  "campus-updated": "Kampus yeniləndi.",
  "contact-archived": "Kontakt arxivləndi.",
  "contact-created": "Kontakt əlavə edildi.",
  "contact-updated": "Kontakt yeniləndi.",
  "document-archived": "Sənəd arxivləndi.",
  "document-created": "Sənəd saxlanıldı.",
  "document-updated": "Sənəd yeniləndi.",
  "note-created": "Qeyd əlavə edildi.",
  "note-updated": "Qeyd yeniləndi.",
  "news-synced": "Universitet xəbər mənbəyi yoxlanıldı.",
  "period-saved": "Dönəm saxlanıldı.",
  "program-archived": "Proqram arxivləndi.",
  "program-created": "Proqram əlavə edildi.",
  "program-updated": "Proqram yeniləndi.",
  "tuition-created": "Təhsil haqqı qeydi əlavə edildi.",
  "tuition-expired": "Təhsil haqqı qeydi bitmiş kimi işarələndi.",
  "tuition-updated": "Təhsil haqqı qeydi yeniləndi.",
  "university-updated": "Universitet profili yeniləndi.",
};

const errorMessages: Record<string, string> = {
  campus: "Kampus saxlanıla bilmədi. Sahələri yoxlayıb yenidən cəhd edin.",
  contact: "Kontakt saxlanıla bilmədi. Sahələri yoxlayıb yenidən cəhd edin.",
  document: "Sənəd saxlanıla bilmədi. Sahələri yoxlayıb yenidən cəhd edin.",
  "file-required": "Fayl yükləyin və ya xarici fayl URL-i yapışdırın.",
  note: "Qeyd saxlanılmadı. Sahələri yoxlayıb yenidən cəhd edin.",
  "news-source": "Sinxronlaşdırmadan əvvəl universitet xəbər mənbə URL-ni əlavə edin.",
  "news-sync": "Xəbərlər universitet mənbə səhifəsindən sinxronlaşdırıla bilmədi.",
  period: "Dönəm saxlanıla bilmədi. Sahələri yoxlayıb yenidən cəhd edin.",
  program: "Proqram saxlanıla bilmədi. Sahələri yoxlayıb yenidən cəhd edin.",
  tuition: "Təhsil haqqı saxlanıla bilmədi. Sahələri yoxlayıb yenidən cəhd edin.",
  upload: "Fayl yüklənmədi. Fayl tipini, ölçüsünü və Storage icazəsini yoxlayın.",
};

export function UniversityFeedbackToast({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  useEffect(() => {
    if (success) {
      toast.success(successMessages[success] ?? "Uğurla saxlanıldı.");
    }

    if (error) {
      toast.error(errorMessages[error] ?? "Əməliyyat tamamlana bilmədi.");
    }
  }, [error, success]);

  return null;
}
