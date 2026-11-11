<script lang="ts">
	import { browser } from '$app/env';

	import { _, getLocale } from '#lib/i18n/index.js';

	import IconMdiOpenInNew from '@iconify-svelte/mdi/open-in-new';

	import { getCountryStats, toChartGeometry } from './country-stats';

	type Props = {
		/** `country_code_2` from the countries taxonomy */
		countryCode: string;
		countryName: string;
	};

	let { countryCode, countryName }: Props = $props();

	const CHART_WIDTH = 600;
	const CHART_HEIGHT = 160;
	const HUNGER_GAMES_URL = 'https://hunger.openfoodfacts.org';

	// Fetched in the browser so a slow or missing file never delays the page.
	let stats = $derived(
		browser ? getCountryStats(fetch, countryCode).catch(() => null) : Promise.resolve(null)
	);

	let helpLinks = $derived.by(() => {
		const country = encodeURIComponent(countryCode);
		return [
			{
				href: `${HUNGER_GAMES_URL}/green-score?country=${country}`,
				label: $_('facets.country_stats.help_categorize', { default: 'Categorize products' })
			},
			{
				href: `${HUNGER_GAMES_URL}/questions?country=${country}&sorted=true`,
				label: $_('facets.country_stats.help_questions', {
					default: 'Answer questions about products'
				})
			},
			{
				href: `${HUNGER_GAMES_URL}/nutrition?country=${country}`,
				label: $_('facets.country_stats.help_nutrition', { default: 'Complete nutrition tables' })
			},
			{
				href: 'https://crowdin.com/project/openfoodfacts',
				label: $_('facets.country_stats.help_translate', { default: 'Translate Open Food Facts' })
			},
			{
				href: 'https://wiki.openfoodfacts.org/Local_Communities/FrenchTeam/Country_Support',
				label: $_('facets.country_stats.help_guide', {
					default: 'Grow Open Food Facts in your country'
				})
			}
		];
	});

	const formatNumber = (value: number) => value.toLocaleString(getLocale());
	const formatShare = (part: number, total: number) =>
		(part / total).toLocaleString(getLocale(), { style: 'percent', maximumFractionDigits: 1 });
</script>

{#await stats then series}
	{#if series}
		{@const chart = toChartGeometry(series.points, CHART_WIDTH, CHART_HEIGHT)}
		{@const firstYear = series.points[0].month.slice(0, 4)}
		{@const lastYear = series.points[series.points.length - 1].month.slice(0, 4)}
		<section class="my-8 w-full" aria-labelledby="country-stats-title">
			<h2 id="country-stats-title" class="mb-4 text-2xl font-bold">
				{$_('facets.country_stats.title', {
					values: { country: countryName },
					default: 'Products sold in {country}'
				})}
			</h2>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body gap-6">
					<div class="stats stats-vertical bg-base-200 sm:stats-horizontal">
						<div class="stat">
							<div class="stat-title">
								{$_('facets.country_stats.created', { default: 'Products added' })}
							</div>
							<div class="stat-value">{formatNumber(series.created)}</div>
						</div>
						<div class="stat">
							<div class="stat-title">
								{$_('facets.country_stats.completed', { default: 'Products complete' })}
							</div>
							<div class="stat-value">{formatNumber(series.completed)}</div>
							<div class="stat-desc">
								{$_('facets.country_stats.completed_share', {
									values: { share: formatShare(series.completed, series.created) },
									default: '{share} of the products added'
								})}
							</div>
						</div>
					</div>

					<div>
						<svg
							viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
							preserveAspectRatio="none"
							class="h-40 w-full text-primary"
							role="img"
							aria-label={$_('facets.country_stats.chart_label', {
								values: {
									country: countryName,
									from: firstYear,
									to: lastYear,
									count: formatNumber(series.created)
								},
								default:
									'Products added in {country} from {from} to {to}, reaching {count} products.'
							})}
						>
							<path d={chart.area} class="fill-current opacity-15" />
							<path
								d={chart.line}
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								vector-effect="non-scaling-stroke"
							/>
						</svg>
						<p class="mt-1 flex justify-between gap-2 text-xs text-base-content/70">
							<span>{firstYear}</span>
							<span>
								{$_('facets.country_stats.chart_caption', { default: 'Products added over time' })}
							</span>
							<span>{lastYear}</span>
						</p>
					</div>

					<div>
						<h3 class="mb-2 text-lg font-semibold">
							{$_('facets.country_stats.help_title', {
								values: { country: countryName },
								default: 'Help with products from {country}'
							})}
						</h3>
						<ul class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
							{#each helpLinks as link (link.href)}
								<li>
									<a
										class="inline-flex link items-center gap-1 link-primary"
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
									>
										{link.label}
										<IconMdiOpenInNew class="h-4 w-4" aria-hidden="true" />
									</a>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		</section>
	{/if}
{/await}
