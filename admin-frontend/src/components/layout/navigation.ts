import {
  LayoutDashboard,
  House,
  Package,
  ShoppingBag,
  Star,
  MessageSquare,
  Palette,
  Clapperboard,
  Box,
  Newspaper,
  Ticket,
  Heart,
  CreditCard,
  RotateCcw,
  Users,
  UserCog,
  UserRound,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
  /** Staff page key that grants access to this item. Omit for super-admin-only items. */
  page?: string;
  /** Visible to every signed-in admin account, including the super administrator. */
  staffAlways?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

export const navigation: NavGroup[] = [
  {
    label: "WORKSPACE",
    items: [
      { name: "Overview", path: "/", icon: LayoutDashboard, page: "dashboard" },
      { name: "Home page", path: "/home-manager", icon: House, page: "home" },
    ],
  },
  {
    label: "COMMERCE",
    items: [
      { name: "Products", path: "/products", icon: Package, page: "products" },
      { name: "Orders", path: "/orders", icon: ShoppingBag, page: "orders" },
      { name: "Product reviews", path: "/reviews", icon: Star, page: "reviews" },
      { name: "Community feedback", path: "/feedback", icon: MessageSquare, page: "reviews" },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { name: "Art library", path: "/art", icon: Palette, page: "art" },
      { name: "Motion & animation", path: "/motion", icon: Clapperboard, page: "motion" },
      { name: "3D rigs", path: "/rigs", icon: Box, page: "motion" },
      { name: "News & articles", path: "/news", icon: Newspaper, page: "news" },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { name: "Discounts & coupons", path: "/coupons", icon: Ticket, page: "coupons" },
      { name: "Donations & patrons", path: "/donations", icon: Heart, page: "donations" },
      { name: "Payments & gateway", path: "/payments", icon: CreditCard },
      { name: "Replacements", path: "/replacements", icon: RotateCcw, page: "replacements" },
      { name: "Users & permissions", path: "/users", icon: Users, page: "customers" },
      { name: "Team & roles", path: "/team", icon: UserCog },
      { name: "My profile", path: "/my-profile", icon: UserRound, staffAlways: true },
      { name: "Settings", path: "/settings", icon: Settings },
    ],
  },
];
