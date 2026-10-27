import { useGetPublicConfig } from '@/api/config/config'
import type { GetPublicConfig200 } from '@/api/model'

const DEFAULT_PIN_LENGTH = 4
const DEFAULT_TABLE_CAPACITY = 8
const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥']

// Client-side defaults so the app renders before the config fetch resolves (or
// if it fails); the DB values from /config/public override these once loaded.
const FALLBACK: GetPublicConfig200 = {
	'event.pinLength': DEFAULT_PIN_LENGTH,
	'table.defaultCapacity': DEFAULT_TABLE_CAPACITY,
	'feedback.suggestedReactions': DEFAULT_REACTIONS,
	'feature.feedbackWall': true,
	'feature.floorPlan': true,
	'feature.ordering': true,
	'feature.tables': true,
	'feature.tableCodes': true,
	'event.dinnerTime': '',
	'orders.open': false,
	'banner.enabled': false,
	'banner.message': '',
}

export function useConfig() {
	const { data } = useGetPublicConfig<GetPublicConfig200>({
		// short so opening orders reaches guests quickly; the fallback alone never counts as fresh
		query: {
			staleTime: 60_000,
			initialData: FALLBACK,
			initialDataUpdatedAt: 0,
		},
	})

	const cfg = { ...FALLBACK, ...(data ?? {}) }

	return {
		pinLength: Number(cfg['event.pinLength']) || DEFAULT_PIN_LENGTH,
		defaultTableCapacity:
			Number(cfg['table.defaultCapacity']) || DEFAULT_TABLE_CAPACITY,
		suggestedReactions:
			(cfg['feedback.suggestedReactions'] as string[] | undefined) ??
			DEFAULT_REACTIONS,
		feedbackWall: cfg['feature.feedbackWall'] !== false,
		floorPlan: cfg['feature.floorPlan'] !== false,
		menu: cfg['feature.ordering'] !== false,
		tables: cfg['feature.tables'] !== false,
		tableCodes: cfg['feature.tableCodes'] !== false,
		dinnerTime: String(cfg['event.dinnerTime'] ?? ''),
		ordersOpen: cfg['orders.open'] === true,
		bannerMessage:
			cfg['banner.enabled'] === true
				? String(cfg['banner.message'] ?? '').trim()
				: '',
	}
}
