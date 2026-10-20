"use client";

import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BadgePercentIcon,
  Building2Icon,
  ChevronDownIcon,
  FileTextIcon,
  GraduationCapIcon,
  HeadphonesIcon,
  HomeIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareTextIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  UploadCloudIcon,
  UserRoundIcon,
  XIcon,
  ShoppingBagIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { appModules } from "@/config/modules";
import { logoutAction } from "@/features/auth/actions";
import { defaultLocale, locales, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type AppShellSession = {
  email: string;
  imageUrl?: string | null;
  unreadNotifications?: number;
  portalType: "staff" | "agent" | "student";
  role: string;
};

const studentModules: Array<{
  title: string;
  href: string;
  icon: LucideIcon;
}> = [
  {
    title: "İdarə paneli",
    href: "/dashboard",
    icon: HomeIcon,
  },
  {
    title: "Müraciətlər",
    href: "/applications",
    icon: FileTextIcon,
  },
  {
    title: "Bildirişlər",
    href: "/updates",
    icon: MessageSquareTextIcon,
  },
  {
    title: "Profil",
    href: "/profile",
    icon: UserRoundIcon,
  },
  {
    title: "Universitetlər",
    href: "/universities",
    icon: Building2Icon,
  },
  {
    title: "Sənədlər",
    href: "/documents",
    icon: UploadCloudIcon,
  },
  {
    title: "Xidmətlər",
    href: "/services",
    icon: ShoppingBagIcon,
  },
  {
    title: "Dəstək",
    href: "/support",
    icon: HeadphonesIcon,
  },
];

const agentModules: Array<{
  title: string;
  href: string;
  icon: LucideIcon;
}> = [
  {
    title: "İdarə paneli",
    href: "/dashboard",
    icon: HomeIcon,
  },
  {
    title: "Tələbələr",
    href: "/students",
    icon: GraduationCapIcon,
  },
  {
    title: "Universitetlər",
    href: "/universities",
    icon: Building2Icon,
  },
  {
    title: "Müraciətlər",
    href: "/applications",
    icon: FileTextIcon,
  },
  {
    title: "Komissiyalar",
    href: "/commissions",
    icon: BadgePercentIcon,
  },
  {
    title: "Xidmətlər",
    href: "/services",
    icon: ShoppingBagIcon,
  },
  {
    title: "Dəstək",
    href: "/support",
    icon: HeadphonesIcon,
  },
];

const SIDEBAR_COLLAPSED_STORAGE_KEY = "campus-global-sidebar-collapsed";

export function AppShell({
  children,
  locale,
  session,
}: {
  children: React.ReactNode;
  locale: AppLocale;
  session: AppShellSession;
}) {
  const pathname = normalizeWorkspacePathname(usePathname());
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigationDelayRef = useRef<number | null>(null);
  const isStudentPortal = session.portalType === "student";
  const isAgentPortal = session.portalType === "agent";
  const modules = isStudentPortal
    ? studentModules
    : isAgentPortal
      ? agentModules
      : appModules;
  const userLabel = session.email;
  const roleLabel = isStudentPortal
    ? "Tələbə portalı"
    : isAgentPortal
      ? "Agent portalı"
      : session.role === "SUPER_ADMIN"
        ? "Təsisçi və CEO"
        : session.role
            .toLowerCase()
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
  const userInitials = getInitials(userLabel);
  const unreadNotifications = session.unreadNotifications ?? 0;

  function toggleSidebarCollapsed() {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  }

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsSidebarCollapsed(
        window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true",
      );
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (navigationDelayRef.current) {
      window.clearTimeout(navigationDelayRef.current);
      navigationDelayRef.current = null;
    }

    const timeoutId = window.setTimeout(() => {
      setIsNavigating(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, search]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      try {
        const nextUrl = new URL(href, window.location.href);

        if (nextUrl.origin !== window.location.origin) {
          return;
        }

        const currentPath = `${window.location.pathname}${window.location.search}`;
        const nextPath = `${nextUrl.pathname}${nextUrl.search}`;

        if (nextPath !== currentPath) {
          if (navigationDelayRef.current) {
            window.clearTimeout(navigationDelayRef.current);
          }

          navigationDelayRef.current = window.setTimeout(() => {
            setIsNavigating(true);
          }, 150);
        }
      } catch {
        setIsNavigating(false);
      }
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);

      if (navigationDelayRef.current) {
        window.clearTimeout(navigationDelayRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,#f3f7fc_0%,#e9eff6_52%,#e4ebf3_100%)] p-3 text-[#081a3a] lg:p-4">
      <div className="flex min-h-[calc(100svh-1.5rem)] flex-col gap-4 lg:min-h-[calc(100svh-2rem)] lg:flex-row">
        <aside
          className={cn(
            "flex min-w-0 shrink-0 flex-col overflow-hidden rounded-[1.75rem] border border-[#d7e1ed]/90 bg-[#f7f9fc]/96 p-3 shadow-[0_22px_64px_rgba(36,58,91,0.10)] transition-[width,border-radius] duration-300 ease-out lg:sticky lg:top-4 lg:h-[calc(100svh-2rem)] lg:w-[76px] xl:rounded-[2rem]",
            isSidebarCollapsed ? "xl:w-[76px]" : "xl:w-[272px]",
          )}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-[#e3eaf3] px-2 pb-4 pt-2 lg:justify-center lg:px-0 xl:justify-start xl:px-2">
            <BrandLogo className="size-11 rounded-full shadow-[0_8px_22px_rgba(37,99,235,0.20)]" />
            <div
              className={cn(
                "leading-tight lg:hidden",
                !isSidebarCollapsed && "xl:block",
              )}
            >
              <div className="text-[15px] font-bold uppercase tracking-[0.08em]">
                Campus
              </div>
              <div className="text-[15px] font-bold uppercase tracking-[0.08em]">
                Global
              </div>
            </div>
            <Button
              aria-controls="campus-mobile-navigation"
              aria-expanded={isMobileNavOpen}
              aria-label={isMobileNavOpen ? "Menyunu bağla" : "Menyunu aç"}
              className="ml-auto size-10 rounded-xl border border-[#dbe5f1] bg-white text-[#24416e] shadow-sm hover:bg-[#eef5ff] lg:hidden"
              onClick={() => setIsMobileNavOpen((current) => !current)}
              size="icon"
              type="button"
              variant="outline"
            >
              {isMobileNavOpen ? (
                <XIcon className="size-4" />
              ) : (
                <MenuIcon className="size-4" />
              )}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={isSidebarCollapsed ? "Sidebarı genişləndir" : "Sidebarı yığ"}
                  aria-pressed={isSidebarCollapsed}
                  onClick={toggleSidebarCollapsed}
                  className={cn(
                    "hidden size-9 shrink-0 rounded-xl border border-[#e2eaf4] bg-white/70 text-[#405579] hover:bg-[#eaf2ff] hover:text-[#0b61ff] xl:flex",
                    isSidebarCollapsed ? "xl:hidden" : "ml-auto",
                  )}
                >
                  <PanelLeftCloseIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sidebarı yığ</TooltipContent>
            </Tooltip>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={
                  isSidebarCollapsed ? "Sidebar genişlet" : "Sidebar küçült"
                }
                aria-pressed={isSidebarCollapsed}
                onClick={toggleSidebarCollapsed}
                className={cn(
                  "mx-auto mt-3 hidden size-10 shrink-0 rounded-xl border border-[#e5edf8] bg-[#f7faff] text-[#31446c] transition hover:bg-[#eef5ff] hover:text-[#0b61ff] xl:flex",
                  !isSidebarCollapsed && "xl:hidden",
                )}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpenIcon className="size-4" />
                ) : (
                  <PanelLeftCloseIcon className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {isSidebarCollapsed ? "Sidebarı genişləndir" : "Sidebarı yığ"}
            </TooltipContent>
          </Tooltip>

          <nav
            className={cn(
              "mt-3 min-w-0 grid-cols-2 gap-2 min-[520px]:grid-cols-3 lg:mt-4 lg:flex lg:min-h-0 lg:flex-1 lg:grid-cols-none lg:flex-col lg:gap-1 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain lg:pr-1 [scrollbar-color:#cbd8e9_transparent] [scrollbar-width:thin]",
              isMobileNavOpen ? "grid" : "hidden",
            )}
            id="campus-mobile-navigation"
          >
            {modules.map((item) => {
              const Icon = item.icon;
              const baseHref = item.href.split("#")[0] || item.href;
              const isActive =
                "status" in item
                  ? item.status === "active" && pathname.startsWith(item.href)
                  : pathname === baseHref ||
                    pathname.startsWith(`${baseHref}/`);
              const itemClassName = cn(
                "relative flex h-10 w-full min-w-0 shrink-0 items-center justify-start gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                "lg:size-10 lg:justify-center lg:px-0 xl:h-10 xl:w-full",
                isSidebarCollapsed
                  ? "xl:justify-center xl:px-0"
                  : "xl:justify-start xl:px-3",
                "text-[#31446c] hover:bg-[#eaf1fb] hover:text-[#0b61ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b66ff] [&_svg]:size-[18px] [&_svg]:shrink-0",
                isActive &&
                  "bg-[#0b66ff] text-white shadow-[0_8px_18px_rgba(37,99,235,0.20)] hover:bg-[#0b66ff] hover:text-white",
                "status" in item && item.status === "planned" && "opacity-75",
              );

              if (!("status" in item) || item.status === "active") {
                const href = getLocalizedHref(item.href, locale);

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Button asChild variant="ghost" className={itemClassName}>
                        <NextLink
                          href={href}
                          aria-label={item.title}
                          onClick={() => setIsMobileNavOpen(false)}
                          onFocus={() => router.prefetch(href)}
                          onMouseEnter={() => router.prefetch(href)}
                        >
                          <Icon />
                          <span
                            className={cn(
                              "min-w-0 truncate lg:hidden",
                              !isSidebarCollapsed && "xl:inline",
                            )}
                          >
                            {item.title}
                          </span>
                          {isAgentPortal &&
                          item.href === "/updates" &&
                          unreadNotifications > 0 ? (
                            <span
                              className={cn(
                                "ml-auto flex min-w-5 items-center justify-center rounded-full bg-[#0b66ff] px-1.5 text-[10px] font-black text-white",
                                isActive && "bg-white text-[#0b66ff]",
                                "lg:absolute lg:right-0 lg:top-0 lg:ml-0 lg:translate-x-1/3 lg:-translate-y-1/3",
                                !isSidebarCollapsed &&
                                  "xl:static xl:ml-auto xl:translate-x-0 xl:translate-y-0",
                              )}
                            >
                              {Math.min(unreadNotifications, 99)}
                            </span>
                          ) : null}
                        </NextLink>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={10}
                      className={cn(
                        "hidden lg:inline-flex",
                        !isSidebarCollapsed && "xl:hidden",
                      )}
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Button
                  key={item.href}
                  type="button"
                  variant="ghost"
                  disabled
                  className={itemClassName}
                >
                  <Icon />
                  <span
                    className={cn(
                      "min-w-0 truncate lg:hidden",
                      !isSidebarCollapsed && "xl:inline",
                    )}
                  >
                    {item.title}
                  </span>
                </Button>
              );
            })}
          </nav>

          <form action={logoutAction} className={cn("mt-2 border-t border-[#e3eaf3] pt-2 lg:block", isMobileNavOpen ? "block" : "hidden")}>
            <input name="locale" type="hidden" value={locale} />
            <button className={cn("flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#9b3340] transition hover:bg-[#fff0f1] lg:justify-center lg:px-0 xl:justify-start xl:px-3", isSidebarCollapsed && "xl:justify-center xl:px-0")} type="submit" aria-label="Hesabdan çıxış">
              <LogOutIcon className="size-[18px] shrink-0" />
              <span className={cn("lg:hidden", !isSidebarCollapsed && "xl:inline")}>Çıxış</span>
            </button>
          </form>

          <div
            className={cn(
              "mt-3 hidden shrink-0 flex-col gap-2 border-t border-[#e3eaf3] pt-3 xl:flex",
              isSidebarCollapsed && "items-center",
            )}
          >
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-3xl border border-[#d8e2ee] bg-[#fafbfd] p-3 text-left shadow-[0_12px_30px_rgba(36,58,91,0.07)] transition",
                isSidebarCollapsed && "size-12 justify-center rounded-2xl p-0",
              )}
              aria-label={`${userLabel} hesabı`}
            >
              <Avatar className="size-11">
                {session.imageUrl ? (
                  <AvatarImage alt="" src={session.imageUrl} />
                ) : null}
                <AvatarFallback className="bg-[#eaf2ff] text-[#0b61ff]">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn("min-w-0 flex-1", isSidebarCollapsed && "hidden")}
              >
                <span className="block truncate text-sm font-semibold">
                  {userLabel}
                </span>
                <span className="block truncate text-xs text-[#617195]">
                  {roleLabel}
                </span>
              </span>
              <ChevronDownIcon className={cn(isSidebarCollapsed && "hidden")} />
            </button>

            <NextLink
              href={getLocalizedHref("/support", locale)}
              className={cn(
                "flex w-full items-center gap-3 rounded-3xl bg-[#f5f8fd] p-3 text-left transition hover:bg-[#eef5ff]",
                isSidebarCollapsed && "size-12 justify-center rounded-2xl p-0",
              )}
              aria-label="Dəstəyə yazın"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#e6f0ff] text-[#0b61ff]">
                <LifeBuoyIcon />
              </span>
              <span
                className={cn("min-w-0 flex-1", isSidebarCollapsed && "hidden")}
              >
                <span className="block truncate text-sm font-semibold">
                  Kömək lazımdır?
                </span>
                <span className="block truncate text-xs text-[#617195]">
                  Dəstəyə yazın
                </span>
              </span>
              <MessageSquareTextIcon
                className={cn(isSidebarCollapsed && "hidden")}
              />
            </NextLink>
          </div>
        </aside>

        <main
          aria-busy={isNavigating}
          className="relative min-w-0 flex-1 overflow-hidden rounded-[2rem] border border-[#d7e1ed] bg-[var(--surface-canvas)] shadow-[0_24px_72px_rgba(36,58,91,0.11)]"
        >
          {isNavigating ? (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-1 overflow-hidden bg-[#dbeafe]">
                <span className="erp-route-progress block h-full w-1/2 rounded-full bg-[#0b66ff]" />
              </div>
              <div className="pointer-events-none absolute right-4 top-4 z-30 hidden items-center gap-2 rounded-full border border-[#d7e5f7] bg-white/90 px-3 py-2 text-xs font-bold text-[#1e3768] shadow-[0_14px_34px_rgba(15,23,42,0.10)] backdrop-blur md:flex">
                <span className="size-2 rounded-full bg-[#0b66ff] animate-pulse" />
                Yüklənir...
              </div>
            </>
          ) : null}
          <div
            className={cn(
              "min-h-full transition-opacity duration-200",
              isNavigating && "opacity-75",
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function getInitials(value: string) {
  const [first = "", second = ""] = value
    .replace(/@.*/, "")
    .split(/[.\s_-]+/)
    .filter(Boolean);

  return `${first.charAt(0)}${second.charAt(0) || first.charAt(1) || ""}`
    .toUpperCase()
    .slice(0, 2);
}

function getLocalizedHref(href: string, locale: AppLocale) {
  if (
    locale === defaultLocale ||
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://")
  ) {
    return href;
  }

  return href.startsWith("/") ? `/${locale}${href}` : `/${locale}/${href}`;
}

function normalizeWorkspacePathname(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const maybeLocale = parts[0];

  if (locales.includes(maybeLocale as AppLocale)) {
    return `/${parts.slice(1).join("/")}`;
  }

  return pathname || "/";
}
