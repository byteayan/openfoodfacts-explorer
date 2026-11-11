import { STATIC_HOST } from '#lib/const.js';

/**
 * One per-country file of Product Opener's product statistics.
 * Keys are days since 1970-01-01 and values are running totals.
 */
export type CountryStats = {
	created_t?: Record<string, number>;
	completed_t?: Record<string, number>;
};

export type CountryStatsPoint = {
	/** Month as YYYY-MM */
	month: string;
	created: number;
	completed: number;
};

export type CountryStatsSeries = {
	points: CountryStatsPoint[];
	created: number;
	completed: number;
};

const DAY_MS = 86_400_000;

/**
 * Turns the daily totals into one point per month, keeping the last total of each month.
 * @returns null when the file has no product yet
 */
export function toSeries(stats: CountryStats | null | undefined): CountryStatsSeries | null {
	const created = stats?.created_t ?? {};
	const completed = stats?.completed_t ?? {};
	const days = Object.keys(created)
		.map(Number)
		.filter(Number.isFinite)
		.sort((a, b) => a - b);

	const points: CountryStatsPoint[] = [];
	let lastCompleted = 0;
	for (const day of days) {
		lastCompleted = completed[day] ?? lastCompleted;
		const month = new Date(day * DAY_MS).toISOString().slice(0, 7);
		const point = { month, created: created[day], completed: lastCompleted };

		if (points.at(-1)?.month === month) points[points.length - 1] = point;
		else points.push(point);
	}

	const last = points.at(-1);
	if (!last || last.created === 0) return null;
	return { points, created: last.created, completed: last.completed };
}

/**
 * Fetches the statistics of one country.
 * @param countryCode - `country_code_2` from the countries taxonomy (`uk`, not `gb`)
 * @returns null when the country has no statistics file
 */
export async function getCountryStats(
	fetch: typeof window.fetch,
	countryCode: string
): Promise<CountryStatsSeries | null> {
	const code = encodeURIComponent(countryCode.toLowerCase());
	const response = await fetch(`${STATIC_HOST}/data/products_stats/products_stats_${code}.json`);
	if (!response.ok) return null;
	return toSeries(await response.json());
}

export type ChartGeometry = {
	/** SVG path of the line, in a `width` x `height` box */
	line: string;
	/** The same line closed along the bottom edge */
	area: string;
};

/** Scales the "products added" totals to an SVG path. */
export function toChartGeometry(
	points: CountryStatsPoint[],
	width: number,
	height: number
): ChartGeometry {
	const max = Math.max(...points.map((point) => point.created), 1);
	const step = points.length > 1 ? width / (points.length - 1) : 0;
	const coords = points.map((point, index) => {
		const x = (index * step).toFixed(1);
		const y = (height - (point.created / max) * height).toFixed(1);
		return `${x},${y}`;
	});

	const line = `M${coords.join('L')}`;
	const lastX = ((points.length - 1) * step).toFixed(1);
	return { line, area: `${line}L${lastX},${height}L0,${height}Z` };
}
