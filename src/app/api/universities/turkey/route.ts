import { NextResponse } from "next/server";

import {
  inferTurkeyUniversityCity,
  mergeTurkeyUniversityOptions,
  searchTurkeyUniversities,
} from "@/features/universities/data/turkey-universities";

type HipoUniversity = {
  country?: string;
  domains?: string[];
  name?: string;
  web_pages?: string[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const universities = await getTurkeyUniversities(search);

  return NextResponse.json({ universities });
}

async function getTurkeyUniversities(search: string) {
  const query = new URLSearchParams({ country: "Turkey" });
  if (search) {
    query.set("name", search);
  }

  try {
    const response = await fetch(
      `https://universities.hipolabs.com/search?${query.toString()}`,
      {
        next: { revalidate: 60 * 60 * 24 },
      },
    );

    if (!response.ok) {
      throw new Error(`University API returned ${response.status}`);
    }

    const payload = (await response.json()) as HipoUniversity[];
    const normalized = payload
      .map((item) => ({
        city: inferTurkeyUniversityCity(item.name ?? ""),
        country: item.country ?? "Turkey",
        domain: item.domains?.[0] ?? "",
        name: item.name ?? "",
        website: item.web_pages?.[0] ?? "",
      }))
      .filter((item) => item.name)
      .slice(0, 80);

    if (normalized.length > 0) {
      return mergeTurkeyUniversityOptions(
        normalized,
        searchTurkeyUniversities(search),
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Turkey university API fallback: ${String(error)}`);
    }
  }

  return searchTurkeyUniversities(search);
}
