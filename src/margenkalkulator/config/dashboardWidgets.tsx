// ============================================
// Dashboard Widgets Registry
// ============================================

import { lazy, ComponentType } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  TrendingUp,
  PiggyBank,
  Percent,
  AlertTriangle,
  Clock,
  Activity,
  CalendarDays,
  Target,
  BarChart3,
  Sparkles,
  Type,
  Zap,
} from "lucide-react";

// Lazy load all widget components
const WelcomeWidget = lazy(() => import("@/margenkalkulator/ui/components/WelcomeWidget").then(m => ({ default: m.WelcomeWidget })));
const WelcomeBanner = lazy(() => import("@/margenkalkulator/ui/components/widgets/WelcomeBanner").then(m => ({ default: m.WelcomeBanner })));
const HeadlineWidget = lazy(() => import("@/margenkalkulator/ui/components/widgets/HeadlineWidget").then(m => ({ default: m.HeadlineWidget })));
const QuickActionsWidget = lazy(() => import("@/margenkalkulator/ui/components/widgets/QuickActionsWidget").then(m => ({ default: m.QuickActionsWidget })));
const TodayTasksWidget = lazy(() => import("@/margenkalkulator/ui/components/TodayTasksWidget").then(m => ({ default: m.TodayTasksWidget })));
const DashboardWidgets = lazy(() => import("@/margenkalkulator/ui/components/DashboardWidgets").then(m => ({ default: m.DashboardWidgets })));
const AverageMarginWidget = lazy(() => import("@/margenkalkulator/ui/components/AverageMarginWidget").then(m => ({ default: m.AverageMarginWidget })));
const ProvisionSourcesWidget = lazy(() => import("@/margenkalkulator/ui/components/ProvisionSourcesWidget").then(m => ({ default: m.ProvisionSourcesWidget })));
const DiscountUsageWidget = lazy(() => import("@/margenkalkulator/ui/components/DiscountUsageWidget").then(m => ({ default: m.DiscountUsageWidget })));
const CriticalOffersWidget = lazy(() => import("@/margenkalkulator/ui/components/CriticalOffersWidget").then(m => ({ default: m.CriticalOffersWidget })));
const RevenueForecastWidget = lazy(() => import("@/margenkalkulator/ui/components/RevenueForecastWidget").then(m => ({ default: m.RevenueForecastWidget })));
const UpcomingEventsWidget = lazy(() => import("@/margenkalkulator/ui/components/UpcomingEventsWidget").then(m => ({ default: m.UpcomingEventsWidget })));
const FollowupReminders = lazy(() => import("@/margenkalkulator/ui/components/FollowupReminders").then(m => ({ default: m.FollowupReminders })));
const RecentActivityFeed = lazy(() => import("@/margenkalkulator/ui/components/RecentActivityFeed").then(m => ({ default: m.RecentActivityFeed })));
const MiniCalendarWidget = lazy(() => import("@/margenkalkulator/ui/components/MiniCalendarWidget").then(m => ({ default: m.MiniCalendarWidget })));

export type WidgetCategory = "general" | "productivity" | "analytics" | "sales";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  component: ComponentType<any>;
  icon: ComponentType<{ className?: string }>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  category: WidgetCategory;
  requiresAuth?: boolean;
  isNew?: boolean;
}

export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

// Widget Registry
export const DASHBOARD_WIDGETS: Record<string, WidgetDefinition> = {
  "headline": {
    id: "headline",
    name: "Überschrift",
    description: "\"Wie möchten Sie kalkulieren?\" Headline",
    component: HeadlineWidget,
    icon: Type,
    defaultSize: { w: 4, h: 1 },
    minSize: { w: 2, h: 1 },
    category: "general",
  },
  "quick-actions": {
    id: "quick-actions",
    name: "Schnellzugriff",
    description: "Neuer Kunde, Kundensuche, Angebot, VVL-Liste",
    component: QuickActionsWidget,
    icon: Zap,
    defaultSize: { w: 4, h: 1 },
    minSize: { w: 2, h: 1 },
    category: "general",
  },
  "welcome-banner": {
    id: "welcome-banner",
    name: "Willkommen Banner",
    description: "Großes Begrüßungs-Banner mit Firmenlogo",
    component: WelcomeBanner,
    icon: Sparkles,
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 1 },
    category: "general",
    requiresAuth: true,
    isNew: true,
  },
  "welcome": {
    id: "welcome",
    name: "Willkommen (kompakt)",
    description: "Kompakte Begrüßung und Schnellstart",
    component: WelcomeWidget,
    icon: Sparkles,
    defaultSize: { w: 4, h: 1 },
    minSize: { w: 2, h: 1 },
    category: "general",
  },
  "tasks": {
    id: "tasks",
    name: "Aufgaben",
    description: "Anstehende Aufgaben und VVL-Erinnerungen",
    component: TodayTasksWidget,
    icon: ListTodo,
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 1 },
    category: "productivity",
    requiresAuth: true,
  },
  "calendar-mini": {
    id: "calendar-mini",
    name: "Mini-Kalender",
    description: "7-Tage Kalendervorschau",
    component: MiniCalendarWidget,
    icon: Calendar,
    defaultSize: { w: 1, h: 2 },
    minSize: { w: 1, h: 1 },
    category: "productivity",
    requiresAuth: true,
    isNew: true,
  },
  "dashboard-widgets": {
    id: "dashboard-widgets",
    name: "KPIs",
    description: "Angebote, Potenzial und Top-Tarife",
    component: DashboardWidgets,
    icon: LayoutDashboard,
    defaultSize: { w: 4, h: 1 },
    minSize: { w: 2, h: 1 },
    category: "analytics",
    requiresAuth: true,
  },
  "margin-analytics": {
    id: "margin-analytics",
    name: "Margen-Analyse",
    description: "Durchschnittliche Marge und Trends",
    component: AverageMarginWidget,
    icon: TrendingUp,
    defaultSize: { w: 4, h: 1 },
    minSize: { w: 2, h: 1 },
    category: "analytics",
    requiresAuth: true,
  },
  "provision-sources": {
    id: "provision-sources",
    name: "Provisions-Quellen",
    description: "Aufschlüsselung der Provisionsquellen",
    component: ProvisionSourcesWidget,
    icon: PiggyBank,
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    category: "analytics",
    requiresAuth: true,
  },
  "discount-usage": {
    id: "discount-usage",
    name: "Rabatt-Nutzung",
    description: "Übersicht genutzter Rabatte",
    component: DiscountUsageWidget,
    icon: Percent,
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    category: "analytics",
    requiresAuth: true,
  },
  "critical-offers": {
    id: "critical-offers",
    name: "Kritische Angebote",
    description: "Angebote mit niedriger Marge",
    component: CriticalOffersWidget,
    icon: AlertTriangle,
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    category: "sales",
    requiresAuth: true,
  },
  "revenue-forecast": {
    id: "revenue-forecast",
    name: "Umsatz-Prognose",
    description: "Erwarteter Umsatz der nächsten Monate",
    component: RevenueForecastWidget,
    icon: BarChart3,
    defaultSize: { w: 1, h: 2 },
    minSize: { w: 1, h: 1 },
    category: "analytics",
    requiresAuth: true,
  },
  "upcoming-events": {
    id: "upcoming-events",
    name: "Termine",
    description: "Nächste anstehende Termine",
    component: UpcomingEventsWidget,
    icon: CalendarDays,
    defaultSize: { w: 1, h: 2 },
    minSize: { w: 1, h: 1 },
    category: "productivity",
    requiresAuth: true,
  },
  "followup-reminders": {
    id: "followup-reminders",
    name: "Follow-ups",
    description: "Anstehende Nachfass-Aktionen",
    component: FollowupReminders,
    icon: Clock,
    defaultSize: { w: 1, h: 2 },
    minSize: { w: 1, h: 1 },
    category: "sales",
    requiresAuth: true,
  },
  "recent-activity": {
    id: "recent-activity",
    name: "Aktivitäten",
    description: "Letzte Aktivitäten und Änderungen",
    component: RecentActivityFeed,
    icon: Activity,
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 1 },
    category: "general",
    requiresAuth: true,
  },
};

// Default layout for new users
export const DEFAULT_DASHBOARD_LAYOUT: WidgetLayout[] = [
  { id: "welcome-banner", x: 0, y: 0, w: 4, h: 2, visible: true },
  { id: "headline", x: 0, y: 2, w: 4, h: 1, visible: true },
  { id: "quick-actions", x: 0, y: 3, w: 4, h: 1, visible: true },
  { id: "tasks", x: 0, y: 4, w: 4, h: 2, visible: true },
  { id: "dashboard-widgets", x: 0, y: 6, w: 4, h: 1, visible: true },
  { id: "margin-analytics", x: 0, y: 7, w: 4, h: 1, visible: true },
  { id: "calendar-mini", x: 0, y: 8, w: 1, h: 2, visible: true },
  { id: "revenue-forecast", x: 1, y: 8, w: 1, h: 2, visible: true },
  { id: "upcoming-events", x: 2, y: 8, w: 1, h: 2, visible: true },
  { id: "followup-reminders", x: 3, y: 8, w: 1, h: 2, visible: true },
  { id: "recent-activity", x: 0, y: 10, w: 4, h: 2, visible: true },
];

// Category labels
export const WIDGET_CATEGORIES: Record<WidgetCategory, { name: string; icon: ComponentType<{ className?: string }> }> = {
  general: { name: "Allgemein", icon: LayoutDashboard },
  productivity: { name: "Produktivität", icon: Target },
  analytics: { name: "Analytics", icon: BarChart3 },
  sales: { name: "Vertrieb", icon: TrendingUp },
};

// Get widgets by category
export function getWidgetsByCategory(): Record<WidgetCategory, WidgetDefinition[]> {
  const result: Record<WidgetCategory, WidgetDefinition[]> = {
    general: [],
    productivity: [],
    analytics: [],
    sales: [],
  };
  
  Object.values(DASHBOARD_WIDGETS).forEach(widget => {
    result[widget.category].push(widget);
  });
  
  return result;
}
