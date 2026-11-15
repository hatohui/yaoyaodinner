import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getGetPresetMenusQueryOptions } from '@/api/preset-menus/preset-menus'
import type { PresetMenuDto } from '@/api/model'

export function useActivePreset(eventId?: string | null) {
	const { i18n } = useTranslation()
	const { data: presets = [], isLoading } = useQuery(
		getGetPresetMenusQueryOptions<PresetMenuDto[]>({
			lang: i18n.language,
			eventId: eventId ?? undefined,
		})
	)
	return { preset: presets.find(p => p.isActive), isLoading }
}
