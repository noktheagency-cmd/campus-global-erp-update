import {
  ArchiveIcon,
  BadgePercentIcon,
  BarChart3Icon,
  BriefcaseBusinessIcon,
  Building2Icon,
  FileTextIcon,
  GraduationCapIcon,
  HeadphonesIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserRoundCogIcon,
  UsersRoundIcon,
  WalletCardsIcon,
  ShoppingBagIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AppModule = {
  title: string;
  href: string;
  icon: LucideIcon;
  status: "active" | "planned";
};

export const appModules: AppModule[] = [
  {
    title: "İdarə paneli",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    status: "active",
  },
  {
    title: "Universitetlər",
    href: "/universities",
    icon: Building2Icon,
    status: "active",
  },
  {
    title: "Müraciətlər",
    href: "/applications",
    icon: FileTextIcon,
    status: "active",
  },
  {
    title: "Tələbələr",
    href: "/students",
    icon: GraduationCapIcon,
    status: "active",
  },
  {
    title: "Agentlər",
    href: "/agents",
    icon: UsersRoundIcon,
    status: "active",
  },
  {
    title: "Xidmətlər",
    href: "/services",
    icon: ShoppingBagIcon,
    status: "active",
  },
  {
    title: "Maliyyə",
    href: "/finance",
    icon: WalletCardsIcon,
    status: "active",
  },
  {
    title: "Komissiyalar",
    href: "/commissions",
    icon: BadgePercentIcon,
    status: "active",
  },
  {
    title: "CRM",
    href: "/crm",
    icon: BriefcaseBusinessIcon,
    status: "active",
  },
  {
    title: "Dəstək",
    href: "/support",
    icon: HeadphonesIcon,
    status: "active",
  },
  {
    title: "Hesabatlar",
    href: "/reports",
    icon: BarChart3Icon,
    status: "planned",
  },
  {
    title: "Arxiv",
    href: "/archive",
    icon: ArchiveIcon,
    status: "planned",
  },
  {
    title: "HR",
    href: "/hr",
    icon: UserRoundCogIcon,
    status: "active",
  },
  {
    title: "Ayarlar",
    href: "/settings",
    icon: SettingsIcon,
    status: "planned",
  },
];
