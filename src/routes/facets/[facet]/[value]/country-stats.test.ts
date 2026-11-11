import { describe, expect, it, vi } from 'vitest';

import { getCountryStats, toChartGeometry, toSeries } from './country-stats';

// Day 15370 is 2012-01-31 and day 15371 is 2012-02-01.
const STATS = {
	created_t: { '15369': 1, '15370': 4, '15371': 9, '15372': 10 },
	completed_t: { '15369': 0, '15370': 1, '15372': 3 }
};

describe('toSeries', () => {
	it('keeps the last total of each month', () => {
		expect(toSeries(STATS)).toEqual({
			points: [
				{ month: '2012-01', created: 4, completed: 1 },
				{ month: '2012-02', created: 10, completed: 3 }
			],
			created: 10,
			completed: 3
		});
	});

	it('carries the completed total over a day that has none', () => {
		expect(
			toSeries({ created_t: { '15370': 4, '15371': 9 }, completed_t: { '15370': 1 } })
		).toEqual({
			points: [
				{ month: '2012-01', created: 4, completed: 1 },
				{ month: '2012-02', created: 9, completed: 1 }
			],
			created: 9,
			completed: 1
		});
	});

	it('returns null without products', () => {
		expect(toSeries(null)).toBeNull();
		expect(toSeries({})).toBeNull();
		expect(toSeries({ created_t: { '15370': 0 } })).toBeNull();
	});
});

describe('getCountryStats', () => {
	it('requests the lower-case country code', async () => {
		const fetch = vi.fn(async () => Response.json(STATS));

		const series = await getCountryStats(fetch as typeof window.fetch, 'UK');

		expect(fetch).toHaveBeenCalledWith(
			'https://static.openfoodfacts.org/data/products_stats/products_stats_uk.json'
		);
		expect(series?.created).toBe(10);
	});

	it('returns null when the country has no file', async () => {
		const fetch = vi.fn(async () => new Response('', { status: 404 }));
		expect(await getCountryStats(fetch as typeof window.fetch, 'zz')).toBeNull();
	});
});

describe('toChartGeometry', () => {
	it('puts the highest total at the top and closes the area along the bottom', () => {
		const { line, area } = toChartGeometry(
			[
				{ month: '2012-01', created: 5, completed: 0 },
				{ month: '2012-02', created: 10, completed: 0 }
			],
			100,
			50
		);

		expect(line).toBe('M0.0,25.0L100.0,0.0');
		expect(area).toBe('M0.0,25.0L100.0,0.0L100.0,50L0,50Z');
	});
});
