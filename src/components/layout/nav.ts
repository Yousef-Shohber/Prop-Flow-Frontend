import {
  Bell,
  Home,
  Building2,
  ClipboardList,
  DoorOpen,
  FileSignature,
  History,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { paths } from "@/routes/paths";
import type { UserRole } from "@/types/enums";

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  roles: readonly UserRole[];
  end?: boolean;
}
export interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const ALL_BUT_STAFF: UserRole[] = ["TENANT", "OWNER", "ADMIN"];
const MANAGERS: UserRole[] = ["OWNER", "ADMIN"];

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.groupOverview",
    items: [
      {
        to: paths.home,
        labelKey: "nav.home",
        icon: Home,
        roles: ["TENANT", "OWNER", "ADMIN", "MAINTENANCE_STAFF"],
        end: true,
      },
      {
        to: paths.dashboard,
        labelKey: "nav.dashboard",
        icon: LayoutDashboard,
        roles: MANAGERS,
      },
    ],
  },
  {
    labelKey: "nav.groupPortfolio",
    items: [
      {
        to: paths.properties,
        labelKey: "nav.properties",
        icon: Building2,
        roles: ALL_BUT_STAFF,
      },
      {
        to: paths.units,
        labelKey: "nav.units",
        icon: DoorOpen,
        roles: ALL_BUT_STAFF,
      },
    ],
  },
  {
    labelKey: "nav.groupOperations",
    items: [
      {
        to: paths.rentalRequests,
        labelKey: "nav.rentalRequests",
        icon: ClipboardList,
        roles: ALL_BUT_STAFF,
      },
      {
        to: paths.leases,
        labelKey: "nav.leases",
        icon: FileSignature,
        roles: ALL_BUT_STAFF,
      },
      {
        to: paths.renewals,
        labelKey: "nav.renewals",
        icon: RefreshCw,
        roles: ALL_BUT_STAFF,
      },
      {
        to: paths.maintenance,
        labelKey: "nav.maintenance",
        icon: Wrench,
        roles: ["TENANT", "OWNER", "ADMIN", "MAINTENANCE_STAFF"],
      },
      {
        to: paths.notifications,
        labelKey: "nav.notifications",
        icon: Bell,
        roles: ["TENANT", "OWNER", "ADMIN", "MAINTENANCE_STAFF"],
      },
    ],
  },
  {
    labelKey: "nav.groupAdmin",
    items: [
      { to: paths.users, labelKey: "nav.users", icon: Users, roles: ["ADMIN"] },
      {
        to: paths.auditLogs,
        labelKey: "nav.auditLogs",
        icon: History,
        roles: ["ADMIN"],
      },
    ],
  },
];
export { ShieldCheck };
export const navFor = (role: UserRole | null) =>
  NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => role && i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);
