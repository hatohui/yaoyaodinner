import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getGetPresetMenusQueryOptions } from '@/api/preset-menus/preset-menus'
import type { PresetMenuDto } from '@/api/model'
import { IncludedNoteStrip } from '@/components/common/IncludedNoteStrip'

export function IncludedNote() {
	const { i18n } = useTranslation()
	const { data: presets = [] } = useQuery(
		getGetPresetMenusQueryOptions<PresetMenuDto[]>({ lang: i18n.language })
	)
	const note = presets.find(p => p.isActive)?.note

	return note ? <IncludedNoteStrip note={note} /> : null
}
