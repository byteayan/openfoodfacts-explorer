import { WEBSITE_FLAVOR_METADATA, type WebsiteFlavor } from '#lib/flavor.js';
import type { AttributeGroup } from '#lib/types/sdk-overrides.js';

// Only the food server lists `values` for each attribute. The other flavors
// send none, and the four standard levels apply.
export const DEFAULT_PREFERENCE_VALUES = [
	'not_important',
	'important',
	'very_important',
	'mandatory'
] as const;

/** Fills in missing `values` and drops groups that have no attribute to choose. */
export function normalizeAttributeGroups(groups: AttributeGroup[]): AttributeGroup[] {
	return groups
		.map((group) => ({
			...group,
			attributes: (group.attributes ?? []).map((attribute) => ({
				...attribute,
				values: attribute.values ?? [...DEFAULT_PREFERENCE_VALUES]
			}))
		}))
		.filter((group) => group.attributes.length > 0);
}

/** Loads the preference groups of one flavor from that flavor's own server. */
export async function getFlavorAttributeGroups(
	fetch: typeof window.fetch,
	flavor: WebsiteFlavor,
	lc: string
): Promise<AttributeGroup[]> {
	const url = new URL('/api/v3.4/attribute_groups', WEBSITE_FLAVOR_METADATA[flavor].apiBaseUrl);
	url.searchParams.set('lc', lc);

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Attribute groups request failed with status ${response.status}`);
	}

	const body: { attribute_groups?: AttributeGroup[] } = await response.json();
	return normalizeAttributeGroups(body.attribute_groups ?? []);
}
