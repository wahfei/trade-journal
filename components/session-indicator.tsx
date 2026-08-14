"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDuration, getSessionSegments, getSessionStatus, getUtcMinuteOfDay } from "@/lib/sessions";
import { cn } from "@/lib/utils";
import clsx from "clsx";

const HOUR_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

export function SessionIndicator({ show }: { show: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const prevOpenKeys = useRef<Set<string>>(new Set());
  const isFirstRun = useRef(true);

  // Clock – update every second
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Load saved preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("session-alerts-enabled");
    if (saved === "true" && Notification.permission === "granted") {
      setAlertsEnabled(true);
    }
  }, []);

  const segments = useMemo(() => getSessionSegments(), []);

  // Detect session open / close and show notification
  useEffect(() => {
    if (!now || typeof window === "undefined" || !("Notification" in window)) return;
    if (!alertsEnabled || Notification.permission !== "granted") return;

    const statuses = getSessionStatus(now);
    const currentlyOpen = new Set(
      statuses.filter((s) => s.isOpen).map((s) => s.def.key)
    );

    // Skip notification on the very first run
    if (isFirstRun.current) {
      prevOpenKeys.current = currentlyOpen;
      isFirstRun.current = false;
      return;
    }

    // ── Sessions that just OPENED ──
    for (const key of currentlyOpen) {
      if (!prevOpenKeys.current.has(key)) {
        const session = statuses.find((s) => s.def.key === key);
        if (session) {
          new Notification(`${session.def.name} session is now open`, {
            body: `Closes in ${formatDuration(session.minutesUntilChange)}`,
            icon: "/favicon.ico",
            tag: `session-open-${key}`,
          });
        }
      }
    }

    // ── Sessions that just CLOSED ──
    for (const key of prevOpenKeys.current) {
      if (!currentlyOpen.has(key)) {
        const session = statuses.find((s) => s.def.key === key);
        if (session) {
          new Notification(`${session.def.name} session has closed`, {
            body: `Opens again in ${formatDuration(session.minutesUntilChange)}`,
            icon: "/favicon.ico",
            tag: `session-close-${key}`,
          });
        }
      }
    }

    prevOpenKeys.current = currentlyOpen;
  }, [now, alertsEnabled]);

  // Toggle alerts
  const toggleAlerts = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission === "granted") {
      const next = !alertsEnabled;
      setAlertsEnabled(next);
      localStorage.setItem("session-alerts-enabled", String(next));
      return;
    }

    if (Notification.permission === "denied") {
      alert("Notifications are blocked. Please enable them in your browser settings.");
      return;
    }

    // permission === "default"
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setAlertsEnabled(true);
      localStorage.setItem("session-alerts-enabled", "true");
    }
  };

  if (!now) {
    return (
      <div
        className="h-[236px] rounded-xl border border-border bg-card"
        aria-hidden
      />
    );
  }

  const statuses = getSessionStatus(now);
  const openCount = statuses.filter((s) => s.isOpen).length;
  const nowPct = (getUtcMinuteOfDay(now) / (24 * 60)) * 100;

  const localTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const utcTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <section
      className={clsx(
        "rounded-xl border border-border bg-card p-5",
        show ? "block" : "hidden"
      )}
      aria-label="Forex session status"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                openCount > 0 ? "bg-profit animate-pulse" : "bg-muted-foreground"
              )}
            />
            <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Market Sessions
            </h2>
          </div>
          <p className="mt-1 text-sm text-foreground">
            {openCount === 0 ? (
              <span className="text-muted-foreground">All sessions closed</span>
            ) : (
              <>
                <span className="font-mono text-profit">{openCount}</span> session
                {openCount > 1 ? "s" : ""} open now
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="font-mono text-2xl tabular-nums text-foreground">
              {localTime}
            </div>
            <div className="text-xs text-muted-foreground">
              {tz} · <span className="font-mono">{utcTime} UTC</span>
            </div>
          </div>

          <button
            onClick={toggleAlerts}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              alertsEnabled
                ? "border-profit/40 bg-profit/10 text-profit"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {alertsEnabled ? "🔔 Alerts on" : "Enable alerts"}
          </button>
        </div>
      </div>

      {/* 24h timeline */}
      <div className="mt-6">
        <div className="relative h-16">
          <div className="absolute inset-0 flex flex-col justify-between">
            {statuses.map((s) => (
              <div key={s.def.key} className="relative h-3">
                {segments
                  .filter((seg) => seg.name === s.def.name)
                  .map((seg) => (
                    <div
                      key={seg.key}
                      className={cn(
                        "absolute top-0 h-3 rounded-full transition-opacity",
                        s.isOpen ? "opacity-100" : "opacity-20"
                      )}
                      style={{
                        left: `${seg.leftPct}%`,
                        width: `${seg.widthPct}%`,
                        backgroundColor: seg.color,
                      }}
                    />
                  ))}
              </div>
            ))}
          </div>

          <div
            className="absolute top-0 bottom-0 z-10 w-px bg-foreground"
            style={{ left: `${nowPct}%` }}
          >
            <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-foreground" />
          </div>
        </div>

        <div className="relative mt-2 h-4 max-md:hidden">
          {HOUR_TICKS.map(
            (h) =>
              h && (
                <span
                  key={h}
                  className="absolute -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
                  style={{ left: `${(h / 24) * 100}%` }}
                >
                  {h.toString().padStart(2, "0")}
                </span>
              )
          )}
        </div>
        <p className="mt-1 text-center text-[10px] tracking-wide text-muted-foreground uppercase max-md:hidden">
          Hours in UTC
        </p>
      </div>

      {/* session cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {statuses.map((s) => (
          <div
            key={s.def.key}
            className={cn(
              "rounded-lg border p-3 transition-colors",
              s.isOpen ? "border-border bg-secondary" : "border-border/50 bg-transparent"
            )}
          >
            <div className={clsx("flex items-center gap-2", !s.isOpen && "opacity-25")}>
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.def.color }}
              />
              <span className="truncate text-sm font-medium text-foreground">
                {s.def.name}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between max-md:flex-col">
              <span
                className={cn(
                  "text-xs font-medium",
                  s.isOpen ? "text-profit" : "text-red-500 opacity-50"
                )}
              >
                {s.isOpen ? "Open" : "Closed"}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {s.isOpen ? "closes" : "opens"} {formatDuration(s.minutesUntilChange)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}