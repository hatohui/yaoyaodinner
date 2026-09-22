import { useGetPublicConfig } from '@/api/config/config'
import type { GetPublicConfig200 } from '@/api/model'
import { STALE_TIME_STATIC } from '@/common/constants'

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
}

export function useConfig() {
	const { data } = useGetPublicConfig<GetPublicConfig200>({
		query: { staleTime: STALE_TIME_STATIC, initialData: FALLBACK },
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
		ordering: cfg['feature.ordering'] !== false,
		tables: cfg['feature.tables'] !== false,
	}
}
