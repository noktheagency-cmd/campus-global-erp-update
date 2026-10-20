"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowRightIcon,
  BarChart3Icon,
  Building2Icon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  Globe2Icon,
  GraduationCapIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  MailIcon,
  PlaneIcon,
  ShieldCheckIcon,
  UsersRoundIcon,
} from "lucide-react";

import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginActionState } from "@/features/auth/actions";

type ErpLoginPageProps = {
  locale?: string;
  nextPath?: string;
};

const initialLoginState: LoginActionState = {
  status: "idle",
};

const features = [
  {
    description: "Məlumatlarınız etibarlı qorunur.",
    icon: ShieldCheckIcon,
    title: "Təhlükəsiz giriş",
  },
  {
    description: "Bütün proseslər bir platformada.",
    icon: UsersRoundIcon,
    title: "Vahid idarəetmə",
  },
  {
    description: "Data əsaslı qərarlar əlçatan olsun.",
    icon: BarChart3Icon,
    title: "Real-time hesabat",
  },
] as const;

const languages = [
  { code: "az", label: "AZ" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "tr", label: "TR" },
] as const;

function languageHref(code: string, nextPath: string) {
  const path = code === "az" ? "/login" : `/${code}/login`;
  return nextPath ? `${path}?next=${encodeURIComponent(nextPath)}` : path;
}

export function ErpLoginPage({
  locale = "az",
  nextPath = "",
}: ErpLoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialLoginState,
  );
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#f8fbff] font-sans text-[#07183a]">
      <style>{`
        @keyframes auth-node-float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -9px, 0); }
        }

        @keyframes auth-card-arrive {
          from { opacity: 0; transform: translate3d(0, 14px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-node-motion,
          .auth-card-motion { animation: none !important; }
        }
      `}</style>

      <Image
        alt=""
        aria-hidden="true"
        className="object-cover object-[48%_center] max-lg:object-[74%_center]"
        fill
        preload
        sizes="100vw"
        src="/brand/login-network-background.png"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(248,251,255,0.64)_0%,rgba(248,251,255,0.92)_38%,rgba(248,251,255,0.98)_100%)] lg:hidden" />

      <header className="absolute inset-x-0 top-0 z-30 px-5 py-5 sm:px-8 sm:py-7 lg:px-10 xl:px-12">
        <div className="mx-auto flex w-full max-w-[1580px] items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-3.5">
            <BrandLogo className="size-12 rounded-full ring-1 ring-white/30 shadow-[0_14px_36px_rgba(0,63,190,0.30)] sm:size-14" />
            <span className="truncate text-[17px] font-extrabold tracking-[-0.025em] text-white max-lg:text-[#081d50] sm:text-[22px]">
              Campus Global ERP
            </span>
          </div>

          <details className="group relative">
            <summary className="flex h-11 cursor-pointer list-none items-center gap-3 rounded-full border border-[#b8c9e6] bg-white/72 px-4 text-sm font-bold text-[#172d5d] shadow-[0_12px_30px_rgba(15,42,94,0.06)] outline-none backdrop-blur-md transition hover:border-[#8fb0e6] hover:bg-white focus-visible:ring-4 focus-visible:ring-[#0b66ff]/20 sm:h-12 sm:px-5 sm:text-base [&::-webkit-details-marker]:hidden">
              <Globe2Icon className="size-[18px] text-[#5270aa]" />
              <span>{locale.toUpperCase()}</span>
              <ChevronDownIcon className="size-4 text-[#6d83ad] transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 mt-2 grid min-w-32 overflow-hidden rounded-2xl border border-[#cad8ec] bg-white p-1.5 shadow-[0_18px_50px_rgba(22,54,105,0.18)]">
              {languages.map((language) => (
                <Link
                  className="rounded-xl px-3 py-2 text-sm font-bold text-[#243a67] transition hover:bg-[#edf4ff] hover:text-[#075fff]"
                  href={languageHref(language.code, nextPath)}
                  key={language.code}
                >
                  {language.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </header>

      <div className="relative z-10 grid min-h-svh w-full grid-cols-1 px-5 pb-8 pt-28 sm:px-8 sm:pb-12 sm:pt-32 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:px-10 lg:py-28 xl:px-12">
        <section
          className="relative hidden items-center lg:flex"
          aria-labelledby="login-intro-title"
        >
          <div className="relative z-10 w-full max-w-[700px] translate-y-8 pb-1 pt-7">
            <div className="max-w-[610px]">
              <h1
                className="text-[clamp(42px,3.5vw,54px)] font-black leading-[1.08] tracking-[-0.045em] text-white"
                id="login-intro-title"
              >
                Təhsilin global
                <br />
                idarəetmə mərkəzi
              </h1>
              <p className="mt-5 max-w-[540px] text-[clamp(17px,1.35vw,22px)] leading-[1.5] text-[#e4edff]">
                Tələbə, agent və universitet proseslərini vahid platformadan
                idarə edin.
              </p>
            </div>

            <div className="mt-12 grid max-w-[610px] grid-cols-3 gap-3 xl:gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    className="min-h-[176px] rounded-2xl border border-[#77a7ee]/50 bg-[#0b3e91]/38 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,19,74,0.12)] backdrop-blur-[7px]"
                    key={feature.title}
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-[#0869ff] text-white shadow-[0_10px_28px_rgba(0,92,255,0.38)]">
                      <Icon className="size-[22px]" strokeWidth={2.3} />
                    </span>
                    <h2 className="mt-5 text-[17px] font-extrabold tracking-[-0.02em] text-white xl:text-[18px]">
                      {feature.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#d5e4ff] xl:text-[15px]">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <span className="auth-node-motion pointer-events-none absolute right-[42%] top-[11%] flex size-16 items-center justify-center rounded-full border border-[#5594ec]/75 bg-[#063681]/78 text-white shadow-[0_0_34px_rgba(34,111,255,0.30)] [animation:auth-node-float_6s_ease-in-out_infinite]">
            <Building2Icon className="size-7" strokeWidth={1.8} />
          </span>
          <span className="auth-node-motion pointer-events-none absolute bottom-[-1%] left-[7%] flex size-[68px] items-center justify-center rounded-full border border-[#4c8fe9]/75 bg-[#063681]/72 text-white shadow-[0_0_34px_rgba(34,111,255,0.26)] [animation:auth-node-float_7.5s_ease-in-out_infinite_reverse]">
            <GraduationCapIcon className="size-8" strokeWidth={1.8} />
          </span>
          <span className="auth-node-motion pointer-events-none absolute bottom-[3%] right-[22%] flex size-[72px] items-center justify-center rounded-full border border-[#8bb9f4]/75 bg-[#2876dc]/58 text-white shadow-[0_0_38px_rgba(64,139,255,0.34)] [animation:auth-node-float_7s_ease-in-out_infinite_1s]">
            <PlaneIcon className="size-8" strokeWidth={1.9} />
          </span>
        </section>

        <section
          className="flex items-center justify-center lg:justify-end lg:pl-10 xl:pr-[25%]"
          aria-label="Giriş formu"
        >
          <form
            action={formAction}
            className="auth-card-motion w-full max-w-[404px] rounded-[28px] border border-[#b7ccef] bg-white/88 px-5 py-7 shadow-[0_28px_90px_rgba(20,67,139,0.15)] backdrop-blur-xl [animation:auth-card-arrive_.55s_ease-out_both] sm:px-7 sm:pb-6 sm:pt-7"
            noValidate
          >
            <input name="locale" type="hidden" value={locale} />
            <input name="next" type="hidden" value={nextPath} />

            <div className="mb-4 text-center">
              <BrandLogo className="mx-auto mb-4 size-14 rounded-full ring-1 ring-[#1837c7]/12 shadow-[0_14px_34px_rgba(32,49,199,0.25)]" />
              <h2 className="text-[27px] font-black leading-tight tracking-[-0.035em] text-[#071849]">
                Portala daxil olun
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#7180a0]">
                Hesab məlumatlarınızla davam edin.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2" htmlFor="login-email">
                <span className="text-sm font-bold text-[#142852]">E-poçt</span>
                <span className="relative block">
                  <MailIcon
                    className="pointer-events-none absolute left-4 top-1/2 size-[19px] -translate-y-1/2 text-[#6f82aa]"
                    strokeWidth={1.8}
                  />
                  <Input
                    aria-describedby={
                      emailError ? "login-email-error" : undefined
                    }
                    aria-invalid={Boolean(emailError)}
                    autoComplete="email"
                    className="h-12 rounded-xl border-[#b8cbe7] bg-white/84 pl-12 text-[14px] text-[#0d1d42] shadow-none transition placeholder:text-[#7c8cac] focus-visible:border-[#2672ff] focus-visible:ring-[#1b70ff]/18"
                    id="login-email"
                    name="email"
                    placeholder="ad.soyad@campusglobal.az"
                    required
                    type="email"
                  />
                </span>
                {emailError ? (
                  <span
                    className="block text-xs font-semibold text-[#c2410c]"
                    id="login-email-error"
                  >
                    {emailError}
                  </span>
                ) : null}
              </label>

              <label className="block space-y-2" htmlFor="login-password">
                <span className="text-sm font-bold text-[#142852]">Şifrə</span>
                <span className="relative block">
                  <LockKeyholeIcon
                    className="pointer-events-none absolute left-4 top-1/2 size-[19px] -translate-y-1/2 text-[#6f82aa]"
                    strokeWidth={1.8}
                  />
                  <Input
                    aria-describedby={
                      passwordError ? "login-password-error" : undefined
                    }
                    aria-invalid={Boolean(passwordError)}
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-[#b8cbe7] bg-white/84 pl-12 pr-12 text-[14px] text-[#0d1d42] shadow-none transition placeholder:text-[#7c8cac] focus-visible:border-[#2672ff] focus-visible:ring-[#1b70ff]/18"
                    id="login-password"
                    name="password"
                    placeholder="Şifrənizi daxil edin"
                    required
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    aria-label={
                      showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#61739a] transition hover:bg-[#edf4ff] hover:text-[#0b61ff] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0b66ff]/25"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-[18px]" />
                    ) : (
                      <EyeIcon className="size-[18px]" />
                    )}
                  </button>
                </span>
                {passwordError ? (
                  <span
                    className="block text-xs font-semibold text-[#c2410c]"
                    id="login-password-error"
                  >
                    {passwordError}
                  </span>
                ) : null}
              </label>
            </div>

            {state.status === "error" && state.message ? (
              <div
                aria-live="polite"
                className="mt-4 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm font-semibold leading-5 text-[#9a3412]"
                role="status"
              >
                {state.message}
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-between gap-3 text-[13px] sm:text-sm">
              <label
                className="flex items-center gap-2 font-medium text-[#24365e]"
                htmlFor="remember-me"
              >
                <Checkbox
                  className="border-[#89a4cf] data-[state=checked]:border-[#0767ff] data-[state=checked]:bg-[#0767ff]"
                  defaultChecked
                  id="remember-me"
                  name="remember"
                />
                Məni yadda saxla
              </label>
              <a
                className="shrink-0 font-bold text-[#0561ed] underline-offset-4 hover:underline"
                href="#reset-password"
              >
                Şifrəni unutdunuz?
              </a>
            </div>

            <Button
              className="mt-6 h-[50px] w-full rounded-xl bg-[#0867f7] px-5 text-[15px] font-extrabold shadow-[0_14px_34px_rgba(8,103,247,0.25)] transition hover:bg-[#0058dd]"
              disabled={isPending}
              type="submit"
            >
              <span className="mx-auto">
                {isPending ? "Yoxlanılır..." : "Daxil ol"}
              </span>
              {isPending ? (
                <LoaderCircleIcon className="size-5 animate-spin" />
              ) : (
                <ArrowRightIcon className="size-5" />
              )}
            </Button>

            <div className="mt-5 border-t border-[#d6e1f0] pt-4">
              <div className="flex items-center gap-2.5 text-xs leading-5 text-[#66789d] sm:text-[13px]">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#bfd6f8] bg-[#edf5ff] text-[#0867f7]">
                  <ShieldCheckIcon className="size-[18px]" />
                </span>
                <span>Məlumatlarınız şifrələnir və təhlükəsiz qorunur.</span>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
