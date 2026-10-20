import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  FileTextIcon,
  KeyRoundIcon,
  UserPlusIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentForm } from "@/features/students/components/student-form";
import { getStudentCreateOptions } from "@/features/students/data/create-options";
import type { StudentsSearchParams } from "@/features/students/types";
import { Link } from "@/i18n/navigation";
import {
  getCurrentSession,
  getSessionAgentId,
} from "@/lib/auth/session";

export default async function AddStudentPage({
  searchParams,
}: {
  searchParams: Promise<StudentsSearchParams>;
}) {
  const [createOptions, query] = await Promise.all([
    getStudentCreateOptions(),
    searchParams,
  ]);
  const session = await getCurrentSession();
  const scopedAgentId = session ? getSessionAgentId(session) : null;
  const defaultAgentId = scopedAgentId ?? readParam(query, "agentId");

  return (
    <main className="min-h-full bg-[#f6f9ff] px-5 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-[1620px] flex-col gap-8">
        <header className="flex flex-col gap-6 border-b border-[#dce6f4]/50 py-2 pb-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3">
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5d6d91]">
              <Link
                className="transition hover:text-[#0b66ff] hover:underline"
                href="/students"
              >
                Tələbələr
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#07183a]">Yeni tələbə əlavə et</span>
            </nav>

            <div className="flex items-center gap-4">
              <Button
                asChild
                className="group flex size-11 shrink-0 items-center justify-center rounded-full border border-[#dce6f4] bg-white text-[#24365f] shadow-[0_4px_12px_rgba(36,54,95,0.03)] transition-all duration-300 hover:scale-105 hover:border-[#0b66ff]/30 hover:bg-[#f6f9ff] hover:text-[#0b66ff] hover:shadow-[0_4px_20px_rgba(11,102,255,0.1)]"
                size="icon"
                variant="outline"
              >
                <Link href="/students" aria-label="Tələbələrə qayıt">
                  <ArrowLeftIcon className="size-5 transition-transform duration-300 group-hover:-translate-x-1" />
                </Link>
              </Button>
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-[#07183a] sm:text-3xl">
                    Yeni tələbə əlavə et
                  </h1>
                  <Badge className="rounded-full border-blue-100 bg-[#e8f1ff] px-2.5 py-0.5 text-xs font-semibold text-[#0b66ff] shadow-sm">
                    Qaralama profil
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-[#5d6d91]">
                  Profil, giriş və ümumi sənədləri bir axında tamamlayın.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[2rem] border border-[#dce6f4]/60 bg-white/74 p-2.5 shadow-[0_16px_36px_rgba(29,78,216,0.04)] backdrop-blur-md lg:p-3">
            <div className="flex items-center gap-2.5 rounded-2xl bg-[#e8f1ff] px-4 py-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#0b66ff] text-white shadow-md shadow-[#0b66ff]/15">
                <UserPlusIcon className="size-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase leading-none tracking-wider text-[#0b66ff]">
                  Addım 1
                </div>
                <div className="text-sm font-extrabold text-[#07183a]">
                  Profil
                </div>
              </div>
            </div>

            <div className="hidden h-[2px] w-6 bg-gradient-to-r from-[#0b66ff]/30 to-slate-200 md:block" />

            <div className="hidden items-center gap-2.5 px-3 py-2 opacity-75 md:flex">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#5d6d91]">
                <KeyRoundIcon className="size-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase leading-none tracking-wider text-[#5d6d91]">
                  Addım 2
                </div>
                <div className="text-sm font-bold text-[#24365f]">Giriş</div>
              </div>
            </div>

            <div className="hidden h-[2px] w-6 bg-slate-200 lg:block" />

            <div className="hidden items-center gap-2.5 px-3 py-2 opacity-60 lg:flex">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#5d6d91]">
                <FileTextIcon className="size-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase leading-none tracking-wider text-[#5d6d91]">
                  Addım 3
                </div>
                <div className="text-sm font-bold text-[#24365f]">Sənədlər</div>
              </div>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-[2rem] border border-[#dce6f4]/60 bg-white/74 px-6 py-5 shadow-[0_20px_50px_rgba(29,78,216,0.03)] backdrop-blur-md md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#07183a]">
                Tələbə reyestri
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#637392]">
                Şəxsi, əlaqə, giriş və sənəd məlumatlarını vahid profildə saxlayın.
              </p>
            </div>
            <Badge className="w-fit rounded-full border-emerald-100 bg-[#e9f8ef] px-3.5 py-1 text-xs font-bold text-[#129344] shadow-sm">
              <CheckCircle2Icon data-icon="inline-start" />
              Profil qurulumu üçün hazırdır
            </Badge>
          </div>

          <StudentForm
            createOptions={createOptions}
            defaultAgentId={defaultAgentId}
            isAgentPortal={Boolean(scopedAgentId)}
          />
        </section>
      </div>
    </main>
  );
}

function readParam(searchParams: StudentsSearchParams, key: string) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
