// Forex trading sessions defined in UTC hours (24h clock).
// Ranges may wrap past midnight (e.g. Sydney 21:00 -> 06:00).

export interface SessionDef {
	key: string;
	name: string;
	city: string;
	startUtc: number; // minutes from 00:00 UTC
	endUtc: number; // minutes from 00:00 UTC (may be < start when wrapping)
	color: string; // css variable reference
}

export const SESSIONS: SessionDef[] = [
	{
		key: "sydney",
		name: "Sydney",
		city: "Australia",
		startUtc: 22 * 60,
		endUtc: 7 * 60,
		color: "var(--chart-1)",
	},
	{
		key: "tokyo",
		name: "Tokyo",
		city: "Japan",
		startUtc: 0,
		endUtc: 9 * 60,
		color: "var(--chart-1)",
	},
	{
		key: "london",
		name: "London",
		city: "United Kingdom",
		startUtc: 7 * 60,
		endUtc: 16 * 60,
		color: "var(--chart-1)",
	},
	{
		key: "newyork",
		name: "New York",
		city: "United States",
		startUtc: 12 * 60,
		endUtc: 21 * 60,
		color: "var(--chart-1)",
	},
	{
		key: "test",
		name: "Test Session",
		city: "United States",
		startUtc: 12.5 * 60,
		endUtc: 12.55 * 60,
		color: "var(--chart-1)",
	},
];

export interface SessionStatus {
	def: SessionDef;
	isOpen: boolean;
	// progress through the session 0..1 when open
	progress: number;
	// minutes until it next opens (when closed) or closes (when open)
	minutesUntilChange: number;
}

const DAY = 24 * 60;

function inRange(minute: number, start: number, end: number): boolean {
	if (start <= end) return minute >= start && minute < end;
	// wraps midnight
	return minute >= start || minute < end;
}

// minutes from `minute` forward until we reach `target`
function forwardDistance(minute: number, target: number): number {
	return (target - minute + DAY) % DAY;
}

export function getUtcMinuteOfDay(date: Date): number {
	return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function getSessionStatus(date: Date): SessionStatus[] {
	const minute = getUtcMinuteOfDay(date);
	return SESSIONS.map((def) => {
		const isOpen = inRange(minute, def.startUtc, def.endUtc);
		let progress = 0;
		let minutesUntilChange = 0;
		const span = (def.endUtc - def.startUtc + DAY) % DAY || DAY;
		if (isOpen) {
			const elapsed = (minute - def.startUtc + DAY) % DAY;
			progress = span === 0 ? 0 : elapsed / span;
			minutesUntilChange = forwardDistance(minute, def.endUtc);
		} else {
			minutesUntilChange = forwardDistance(minute, def.startUtc);
		}
		return { def, isOpen, progress, minutesUntilChange };
	});
}

export function formatDuration(mins: number): string {
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	if (h === 0) return `${m}m`;
	if (m === 0) return `${h}h`;
	return `${h}h ${m}m`;
}

// Session bar segments for a 24h timeline. Splits wrapping sessions in two.
export interface SessionSegment {
	key: string;
	name: string;
	color: string;
	leftPct: number;
	widthPct: number;
}

export function getSessionSegments(): SessionSegment[] {
	const segments: SessionSegment[] = [];
	for (const s of SESSIONS) {
		if (s.startUtc <= s.endUtc) {
			segments.push({
				key: s.key,
				name: s.name,
				color: s.color,
				leftPct: (s.startUtc / DAY) * 100,
				widthPct: ((s.endUtc - s.startUtc) / DAY) * 100,
			});
		} else {
			segments.push({
				key: s.key + "-a",
				name: s.name,
				color: s.color,
				leftPct: (s.startUtc / DAY) * 100,
				widthPct: ((DAY - s.startUtc) / DAY) * 100,
			});
			segments.push({
				key: s.key + "-b",
				name: s.name,
				color: s.color,
				leftPct: 0,
				widthPct: (s.endUtc / DAY) * 100,
			});
		}
	}
	return segments;
}
