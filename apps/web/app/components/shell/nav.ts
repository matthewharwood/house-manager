import {
  Baby,
  Briefcase,
  CalendarDays,
  type LucideIcon,
  PawPrint,
  Sparkles,
  Stethoscope,
  Sun,
  UtensilsCrossed,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

// The household areas + the Today/calendar surface (RULES.md §6–§8). This is the
// MIDDLE of the desktop sidebar and the source for the mobile bottom tabs.
// `as const satisfies` keeps each `href` a literal so TanStack Router's typed
// <Link to> accepts it (a plain `string` would not type-check).
export const NAV_ITEMS = [
  { id: "today", label: "Today", href: "/", icon: Sun },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays },
  { id: "meals", label: "Meals", href: "/meals", icon: UtensilsCrossed },
  { id: "chores", label: "Chores", href: "/chores", icon: Sparkles },
  { id: "pets", label: "Pets", href: "/pets", icon: PawPrint },
  { id: "kids", label: "Kids", href: "/kids", icon: Baby },
  { id: "appointments", label: "Appointments", href: "/appointments", icon: Stethoscope },
  { id: "hiring", label: "Hiring", href: "/hiring", icon: Briefcase },
] as const satisfies readonly NavItem[];

// The 4 thumb-reachable destinations on the mobile bottom tab bar; a 5th "More"
// tab opens the drawer for the long tail (RULES.md §11.5, Apple HIG / Material 3).
const PRIMARY_TAB_IDS: readonly string[] = ["today", "calendar", "meals", "chores"];
export const PRIMARY_TABS = NAV_ITEMS.filter((item) => PRIMARY_TAB_IDS.includes(item.id));
