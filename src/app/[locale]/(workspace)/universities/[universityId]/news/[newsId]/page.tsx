import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  GraduationCapIcon,
  MapPinIcon,
  NewspaperIcon,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUniversityNewsDetailData } from "@/features/universities/data/detail-data";
import { formatDate } from "@/features/universities/data/dashboard-data";
import { Link } from "@/i18n/navigation";

export default async function UniversityNewsDetailPage({
  params,
}: {
  params: Promise<{ newsId: string; universityId: string }>;
}) {
  const { newsId, universityId } = await params;
  const data = await getUniversityNewsDetailData(universityId, newsId);

  if (!data) {
    notFound();
  }

  const { news, university } = data;

  return (
    <div className="min-h-full bg-[#f7faff] px-5 py-5 lg:px-7 lg:py-6">
      <section className="rounded-[2rem] border border-[#dce6f4] bg-white p-5 shadow-[0_18px_50px_rgba(29,78,216,0.07)]">
        <Button
          asChild
          className="rounded-2xl border-[#dce6f4] bg-white"
          variant="outline"
        >
          <Link href={`/universities/${university.id}?tab=news`}>
            <ArrowLeftIcon data-icon="inline-start" />
            Xəbərlərə qayıt
          </Link>
        </Button>

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <Badge className="rounded-full bg-[#e8f1ff] px-3 py-1 text-xs font-bold text-[#0b66ff]">
              <NewspaperIcon data-icon="inline-start" />
              Universitet xəbərləri
            </Badge>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-[#07183a] lg:text-4xl">
              {news.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[#5d6d91]">
              {news.summary}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#637392]">
              <span className="inline-flex items-center gap-2">
                <CalendarDaysIcon className="text-[#0b66ff]" />
                {formatDate(news.date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPinIcon className="text-[#0b66ff]" />
                {university.country}, {university.city}
              </span>
              {news.sourceName ? (
                <span className="inline-flex items-center gap-2">
                  <NewspaperIcon className="text-[#0b66ff]" />
                  {news.sourceName}
                </span>
              ) : null}
            </div>
            {news.sourceUrl ? (
              <Button
                asChild
                className="mt-5 rounded-2xl border-[#dce6f4] bg-white text-[#0b66ff]"
                variant="outline"
              >
                <a href={news.sourceUrl} rel="noreferrer" target="_blank">
                  <ExternalLinkIcon data-icon="inline-start" />
                  Mənbəni aç
                </a>
              </Button>
            ) : null}
          </div>

          <Card className="rounded-[1.65rem] border-[#dce6f4] bg-[#fbfdff] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0b66ff]">
                  <GraduationCapIcon />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-[#07183a]">
                    {university.name}
                  </div>
                  <div className="text-sm text-[#637392]">
                    {university.programs.length} cəmi proqram
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <article className="mt-5 overflow-hidden rounded-[2rem] border border-[#dce6f4] bg-white shadow-[0_18px_50px_rgba(29,78,216,0.07)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="h-72 w-full object-cover md:h-96"
          src={news.imageUrl}
        />
        <div className="max-w-4xl p-5 lg:p-8">
          <div className="prose prose-slate max-w-none">
            <p className="text-base leading-8 text-[#334568]">{news.detail}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
