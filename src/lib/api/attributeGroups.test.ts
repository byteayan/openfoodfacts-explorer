import { describe, expect, it, vi } from 'vitest';

import type { AttributeGroup } from '#lib/types/sdk-overrides.js';
import {
	DEFAULT_PREFERENCE_VALUES,
	getFlavorAttributeGroups,
	normalizeAttributeGroups
} from './attributeGroups';

// Shape returned by world.openpetfoodfacts.org
const PETFOOD_GROUPS = [
	{ id: 'labels', attributes: [{ id: 'labels_organic', values: null, default: 'important' }] },
	{ id: 'environment', attributes: [] }
] as unknown as AttributeGroup[];

describe('normalizeAttributeGroups', () => {
	it('offers the four standard levels when the server sends no values', () => {
		const [labels] = normalizeAttributeGroups(PETFOOD_GROUPS);
		expect(labels.attributes?.[0].values).toEqual([...DEFAULT_PREFERENCE_VALUES]);
	});

	it('keeps the values the server sends', () => {
		const groups = [
			{ id: 'allergens', attributes: [{ id: 'no_gluten', values: ['not_important', 'mandatory'] }] }
		] as unknown as AttributeGroup[];

		expect(normalizeAttributeGroups(groups)[0].attributes?.[0].values).toEqual([
			'not_important',
			'mandatory'
		]);
	});

	it('drops groups without attributes', () => {
		expect(normalizeAttributeGroups(PETFOOD_GROUPS).map((group) => group.id)).toEqual(['labels']);
	});
});

describe('getFlavorAttributeGroups', () => {
	it("asks the flavor's own server in the given language", async () => {
		const fetch = vi.fn(async () => Response.json({ attribute_groups: PETFOOD_GROUPS }));

		const groups = await getFlavorAttributeGroups(fetch as typeof window.fetch, 'petfood', 'fr');

		const [[url]] = fetch.mock.calls as unknown as [[URL]];
		expect(url.href).toBe('https://world.openpetfoodfacts.org/api/v3.4/attribute_groups?lc=fr');
		expect(groups.map((group) => group.id)).toEqual(['labels']);
	});

	it('rejects when the server answers with an error', async () => {
		const fetch = vi.fn(async () => new Response('', { status: 503 }));

		await expect(
			getFlavorAttributeGroups(fetch as typeof window.fetch, 'beauty', 'en')
		).rejects.toThrow('503');
	});
});
