import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';

import {
	getPreference,
	personalizedSearch,
	preferencesForFlavor,
	updateAttributePreference,
	type UserPreference
} from './preferencesStore';

const organic = (value: string, flavor?: UserPreference['flavor']): UserPreference => ({
	type: 'attribute',
	groupId: 'labels',
	attributeId: 'labels_organic',
	value,
	...(flavor ? { flavor } : {})
});

describe('preferences per flavor', () => {
	beforeEach(() => {
		personalizedSearch.set({ userPreferences: [], classifyProductsEnabled: false });
	});

	it('reads a choice saved without a flavor as a food choice', () => {
		const saved = [organic('mandatory')];

		expect(preferencesForFlavor(saved, 'food')).toEqual(saved);
		expect(preferencesForFlavor(saved, 'beauty')).toEqual([]);
	});

	it('keeps the same attribute apart for each flavor', () => {
		updateAttributePreference(organic('mandatory'));
		updateAttributePreference(organic('important', 'beauty'));

		const prefs = get(personalizedSearch).userPreferences;
		expect(prefs).toHaveLength(2);

		const value = (flavor: 'food' | 'beauty') =>
			getPreference(preferencesForFlavor(prefs, flavor), 'labels', 'labels_organic')?.value;
		expect(value('food')).toBe('mandatory');
		expect(value('beauty')).toBe('important');
	});

	it('updates a food choice saved before flavors existed instead of duplicating it', () => {
		updateAttributePreference(organic('mandatory'));
		updateAttributePreference(organic('not_important', 'food'));

		const prefs = get(personalizedSearch).userPreferences;
		expect(prefs).toHaveLength(1);
		expect(prefs[0].value).toBe('not_important');
	});
});
