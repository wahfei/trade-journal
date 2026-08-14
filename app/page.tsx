"use client";

import { useMemo, useState } from "react";
import { SessionIndicator } from "@/components/session-indicator";
import { StatsOverview } from "@/components/stats-overview";
import { TradeForm } from "@/components/trade-form";
import { TradeList } from "@/components/trade-list";
import { Button } from "@/components/ui/button";
import { computeStats } from "@/lib/stats";
import { useTrades } from "@/lib/use-trades";
import { Plus, X } from "lucide-react";
import clsx from "clsx";

export default function Page() {
	const { trades, loaded, addTrade, deleteTrade, clearAll } = useTrades();
	const [showForm, setShowForm] = useState(false);
	const [showSession, setShowSession] = useState(true);

	const stats = useMemo(() => computeStats(trades), [trades]);

	return (
		<main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
			<header className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 font-mono text-sm font-bold text-primary">T</div>
					<div>
						<h1 className="text-lg font-semibold tracking-tight text-foreground">My Trade Journal</h1>
						<p className="text-xs text-muted-foreground">Trading journal &amp; session clock</p>
					</div>
				</div>
			</header>

			<div className={clsx(`flex items-center justify-between mt-8 mb-4`)}>
				<Button onClick={() => setShowSession((s) => !s)}>{showSession ? <>Hide Session Tab</> : <>Show Session Tab</>}</Button>
				<Button onClick={() => setShowForm((s) => !s)}>
					{showForm ? (
						<>
							<X className="size-4" /> Close
						</>
					) : (
						<>
							<Plus className="size-4" /> Add trade
						</>
					)}
				</Button>
			</div>

			<div className="space-y-6">
				<SessionIndicator show={showSession} />

				{showForm ? (
					<TradeForm
						onAdd={(t) => {
							addTrade(t);
							setShowForm(false);
						}}
						onCancel={() => setShowForm(false)}
					/>
				) : null}

				<StatsOverview stats={stats} />

				<section aria-label="Trade history">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Journal</h2>
						{trades.length > 0 ? (
							<button
								type="button"
								onClick={() => {
									if (window.confirm("Delete all trades? This cannot be undone.")) {
										clearAll();
									}
								}}
								className="text-xs text-muted-foreground transition-colors hover:text-loss"
							>
								Clear all
							</button>
						) : null}
					</div>
					{loaded ? (
						<TradeList
							trades={trades}
							onDelete={deleteTrade}
						/>
					) : (
						<div className="h-32 rounded-xl border border-border bg-card" />
					)}
				</section>
			</div>

			<footer className="mt-10 text-center text-xs text-muted-foreground">
				Data is stored locally in your browser. Session times are approximate market hours.
			</footer>
		</main>
	);
}
