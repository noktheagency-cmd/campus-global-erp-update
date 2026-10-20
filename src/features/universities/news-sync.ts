import { prisma } from "@/lib/db";

type ExtractedUniversityNews = {
  imageUrl: string | null;
  publishedAt: Date | null;
  sourceName: string;
  sourceUrl: string;
  summary: string | null;
  title: string;
};

type SyncUniversityNewsInput = {
  sourceUrl: string;
  universityId: string;
  universityName: string;
};

type SyncUniversityNewsIfStaleInput = SyncUniversityNewsInput & {
  lastSyncedAt?: Date | null;
  maxAgeMs?: number;
};

const NEWS_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

const NEWS_KEYWORDS = [
  "news",
  "haber",
  "haberler",
  "duyuru",
  "duyurular",
  "announcement",
  "announcements",
  "press",
  "media",
  "event",
  "events",
  "xeber",
  "xeberler",
  "xəbər",
  "xəbərlər",
];

const GENERIC_LINK_TITLES = new Set([
  "all news",
  "back",
  "contact",
  "contacts",
  "details",
  "devami",
  "devamı",
  "daha etrafli",
  "daha ətraflı",
  "home",
  "learn more",
  "more",
  "news",
  "read more",
  "see more",
  "tüm haberler",
  "view details",
  "ətraflı",
]);

export async function syncUniversityNewsIfStale({
  lastSyncedAt,
  maxAgeMs = NEWS_SYNC_INTERVAL_MS,
  sourceUrl,
  universityId,
  universityName,
}: SyncUniversityNewsIfStaleInput) {
  if (lastSyncedAt && Date.now() - lastSyncedAt.getTime() < maxAgeMs) {
    return false;
  }

  try {
    await syncUniversityNewsSource({
      sourceUrl,
      universityId,
      universityName,
    });

    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`University news auto sync failed: ${String(error)}`);
    }

    return false;
  }
}

export async function syncUniversityNewsSource({
  sourceUrl,
  universityId,
  universityName,
}: SyncUniversityNewsInput) {
  const response = await fetch(sourceUrl, {
    cache: "no-store",
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent":
        "CampusGlobalNewsSync/1.0 (+https://campus.global; university news page only)",
    },
  });

  if (!response.ok) {
    throw new Error(`News source responded with ${response.status}.`);
  }

  const html = await response.text();
  const newsItems = extractUniversityNewsFromHtml(
    html,
    sourceUrl,
    universityName,
  );
  const fetchedAt = new Date();

  await prisma.$transaction(async (tx) => {
    for (const item of newsItems) {
      await tx.universityNews.upsert({
        where: {
          universityId_sourceUrl: {
            sourceUrl: item.sourceUrl,
            universityId,
          },
        },
        create: {
          fetchedAt,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl,
          summary: item.summary,
          title: item.title,
          universityId,
        },
        update: {
          fetchedAt,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          sourceName: item.sourceName,
          status: "PUBLISHED",
          summary: item.summary,
          title: item.title,
        },
      });
    }

    await tx.university.update({
      where: { id: universityId },
      data: { newsLastSyncedAt: fetchedAt },
    });
  });

  return {
    fetchedAt,
    newsItemsSynced: newsItems.length,
  };
}

function extractUniversityNewsFromHtml(
  html: string,
  sourceUrl: string,
  universityName: string,
): ExtractedUniversityNews[] {
  const baseUrl = new URL(sourceUrl);
  const sourceName = baseUrl.hostname.replace(/^www\./i, "");
  const sourcePathLooksLikeNews = NEWS_KEYWORDS.some((keyword) =>
    baseUrl.pathname.toLowerCase().includes(keyword),
  );
  const pageImage = absolutizeUrl(
    extractMetaContent(html, "og:image") ??
      extractMetaContent(html, "twitter:image"),
    baseUrl,
  );
  const candidates: ExtractedUniversityNews[] = [];
  const seen = new Map<string, number>();

  for (const match of html.matchAll(
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const href = match[1];
    const absoluteUrl = absolutizeUrl(href, baseUrl);

    if (!absoluteUrl) {
      continue;
    }

    const normalizedUrl = normalizeSourceUrl(absoluteUrl);
    const itemUrl = new URL(normalizedUrl);
    const index = match.index ?? 0;
    const context = html.slice(
      Math.max(0, index - 1100),
      Math.min(html.length, index + 2200),
    );
    const anchorText = cleanHtmlText(match[2]);
    const headingText =
      extractHeadingText(match[2]) ?? extractHeadingText(context);
    const attributeText =
      extractAttribute(match[0], "title") ??
      extractAttribute(match[0], "aria-label");
    const title = chooseNewsTitle(
      anchorText,
      headingText,
      cleanHtmlText(attributeText ?? ""),
    );

    if (
      !title ||
      !isLikelyNewsLink(title, itemUrl, baseUrl, sourcePathLooksLikeNews)
    ) {
      continue;
    }

    const summary = normalizeNewsSummary(extractParagraphText(context), title);
    const imageUrl =
      absolutizeUrl(extractImageSource(context), baseUrl) ?? pageImage;
    const publishedAt = extractPublishedDate(context);

    const candidate = {
      imageUrl,
      publishedAt,
      sourceName,
      sourceUrl: normalizedUrl,
      summary:
        summary ??
        `${universityName} üçün son mənbə səhifəsi yeniləməsi. Tam məqalə üçün mənbəni açın.`,
      title,
    };
    const existingIndex = seen.get(normalizedUrl);

    if (existingIndex === undefined) {
      seen.set(normalizedUrl, candidates.length);
      candidates.push(candidate);
    } else if (!candidates[existingIndex].imageUrl && candidate.imageUrl) {
      candidates[existingIndex] = {
        ...candidates[existingIndex],
        imageUrl: candidate.imageUrl,
        sourceName: candidate.sourceName,
      };
    }
  }

  return candidates
    .sort((a, b) => {
      const dateA = a.publishedAt?.getTime() ?? 0;
      const dateB = b.publishedAt?.getTime() ?? 0;

      return dateB - dateA;
    })
    .slice(0, 12);
}

function chooseNewsTitle(...values: Array<string | null | undefined>) {
  const usefulTitle = values.find((value) => {
    if (!value) {
      return false;
    }

    return !isGenericLinkTitle(value) && value.length >= 10;
  });

  return usefulTitle ?? null;
}

function isLikelyNewsLink(
  title: string,
  itemUrl: URL,
  baseUrl: URL,
  sourcePathLooksLikeNews: boolean,
) {
  const baseHost = baseUrl.hostname.replace(/^www\./i, "");
  const itemHost = itemUrl.hostname.replace(/^www\./i, "");
  const sameUniversityHost =
    itemHost === baseHost ||
    itemHost.endsWith(`.${baseHost}`) ||
    baseHost.endsWith(`.${itemHost}`);

  if (!sameUniversityHost || isGenericLinkTitle(title)) {
    return false;
  }

  const path = itemUrl.pathname.toLowerCase();

  if (
    /\.(avif|css|doc|docx|gif|jpeg|jpg|pdf|png|svg|webp|xls|xlsx|zip)$/i.test(
      path,
    )
  ) {
    return false;
  }

  const combined = `${path} ${itemUrl.search} ${title}`.toLowerCase();
  const hasNewsKeyword = NEWS_KEYWORDS.some((keyword) =>
    combined.includes(keyword),
  );

  return (
    hasNewsKeyword ||
    (sourcePathLooksLikeNews &&
      title.length >= 18 &&
      title.split(/\s+/).length >= 3)
  );
}

function isGenericLinkTitle(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();

  return (
    normalized.length < 4 ||
    GENERIC_LINK_TITLES.has(normalized) ||
    /^read\s+more$/i.test(normalized) ||
    /^more\s*$/i.test(normalized)
  );
}

function extractHeadingText(html: string) {
  const match = html.match(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/i);

  return match ? cleanHtmlText(match[1]) : null;
}

function extractParagraphText(html: string) {
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => cleanHtmlText(match[1]))
    .filter((value) => value.length >= 30);

  return paragraphs[0] ?? null;
}

function extractImageSource(html: string) {
  const matches = html.matchAll(
    /<img\b[^>]*(?:src|data-src)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^"'\s>]+))[^>]*>/gi,
  );

  for (const match of matches) {
    const source = match[1] ?? match[2] ?? match[3] ?? null;

    if (source && !isDecorativeNewsImage(source)) {
      return source;
    }
  }

  return null;
}

function isDecorativeNewsImage(source: string) {
  const normalized = source.toLowerCase();

  return (
    normalized.includes("itu-logo") ||
    normalized.includes("/default-album/") ||
    normalized.includes("/lib/img/itu.")
  );
}

function extractPublishedDate(html: string) {
  const timeMatch =
    html.match(/<time\b[^>]*datetime\s*=\s*["']([^"']+)["'][^>]*>/i) ??
    html.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i);
  const timeValue = timeMatch ? cleanHtmlText(timeMatch[1]) : "";
  const parsedTime = parseNewsDate(timeValue);

  if (parsedTime) {
    return parsedTime;
  }

  const isoMatch = html.match(/\b\d{4}-\d{2}-\d{2}\b/);
  const dottedMatch = html.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{4}\b/);

  return parseNewsDate(isoMatch?.[0] ?? dottedMatch?.[0] ?? "");
}

function parseNewsDate(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  const dayFirst = normalized.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);

  if (dayFirst) {
    return new Date(
      Date.UTC(
        Number(dayFirst[3]),
        Number(dayFirst[2]) - 1,
        Number(dayFirst[1]),
      ),
    );
  }

  const direct = Date.parse(normalized);

  if (!Number.isNaN(direct)) {
    return new Date(direct);
  }

  return null;
}

function normalizeNewsSummary(value: string | null, title: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.toLowerCase() === title.toLowerCase()) {
    return null;
  }

  return normalized.length > 240
    ? `${normalized.slice(0, 237)}...`
    : normalized;
}

function extractMetaContent(html: string, name: string) {
  const escapedName = escapeRegex(name);
  const direct = html.match(
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
  );
  const reversed = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedName}["'][^>]*>`,
      "i",
    ),
  );

  return direct?.[1] ?? reversed?.[1] ?? null;
}

function extractAttribute(html: string, attribute: string) {
  const match = html.match(
    new RegExp(`${escapeRegex(attribute)}\\s*=\\s*["']([^"']+)["']`, "i"),
  );

  return match?.[1] ?? null;
}

function absolutizeUrl(value: string | null | undefined, baseUrl: URL) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value, baseUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeSourceUrl(value: string) {
  const url = new URL(value);
  url.hash = "";

  for (const key of Array.from(url.searchParams.keys())) {
    if (key.toLowerCase().startsWith("utm_")) {
      url.searchParams.delete(key);
    }
  }

  return url.toString().replace(/\/$/, "");
}

function cleanHtmlText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    ccedil: "ç",
    Ccedil: "Ç",
    eacute: "é",
    Eacute: "É",
    gbreve: "ğ",
    Gbreve: "Ğ",
    gt: ">",
    idot: "ı",
    Idot: "İ",
    lt: "<",
    nbsp: " ",
    ograve: "ò",
    ouml: "ö",
    Ouml: "Ö",
    quot: '"',
    scedil: "ş",
    Scedil: "Ş",
    uuml: "ü",
    Uuml: "Ü",
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(
      /&([a-z]+);/gi,
      (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity,
    );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
