"use client";

import { useEffect, useState } from "react";
import { Eye, Lightbulb, Send, UserPlus, UtensilsCrossed } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import {
  AnalyticsSummary,
  fetchAnalyticsSummary,
  fetchRecentViews,
  MenuView,
} from "../analytics-api";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

export function AnalyticsContent() {
  const [currency, setCurrency] = useState("EUR");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [views, setViews] = useState<MenuView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [summaryData, viewsData] = await Promise.all([
          fetchAnalyticsSummary(currency),
          fetchRecentViews(20),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setViews(viewsData);
      } catch {
        if (!cancelled) toast.error("Failed to load analytics");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const counts = summary?.counts;
  const statCards = [
    { title: "Menu Views", value: counts?.menuViews, icon: Eye },
    { title: "Items Created", value: counts?.itemsCreated, icon: UtensilsCrossed },
    { title: "Recommendations", value: counts?.recommendations, icon: Lightbulb },
    { title: "Notifications Sent", value: counts?.notificationsSent, icon: Send },
    { title: "Users Created", value: counts?.usersCreated, icon: UserPlus },
  ];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Event stats and menu views for your restaurant.
          </p>
        </div>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-card-foreground">
                      {isLoading ? "…" : (stat.value ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Average Item Price
            </CardTitle>
            <CardDescription>
              Converted from EUR using live exchange rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">
              {isLoading || summary?.avgItemPrice?.value == null
                ? "—"
                : `${summary.avgItemPrice.value.toFixed(2)} ${summary.avgItemPrice.currency}`}
            </p>
            {summary?.rateSource && (
              <p className="mt-1 text-xs text-muted-foreground">
                rate source: {summary.rateSource}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Recent Menu Views
            </CardTitle>
            <CardDescription>Latest guest visits to your menu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!isLoading && views.length === 0 && (
              <p className="text-sm text-muted-foreground">No views yet.</p>
            )}
            {views.map((view) => (
              <div
                key={view.id}
                className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"
              >
                <span className="text-card-foreground">
                  {view.slug ?? "menu"}
                  {view.table ? ` · table ${view.table}` : ""}
                </span>
                <span className="text-muted-foreground">
                  {new Date(view.viewedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
