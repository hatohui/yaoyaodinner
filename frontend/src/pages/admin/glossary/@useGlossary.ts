import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	getGetGlossaryQueryKey,
	useCreateGlossaryTerm,
	useDeleteGlossaryTerm,
	useGetGlossary,
	useUpdateGlossaryTerm,
} from '@/api/glossary/glossary'
import type { GlossaryTermDto, SaveGlossaryTermDto } from '@/api/model'
import { useToast } from '@/hooks/useToast'

export const GLOSSARY_FIELDS = ['en', 'vi', 'zh', 'th', 'note'] as const
export type GlossaryField = (typeof GLOSSARY_FIELDS)[number]

export function useGlossary() {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const { data: terms = [], isLoading } = useGetGlossary<GlossaryTermDto[]>()

	const refresh = () =>
		qc.invalidateQueries({ queryKey: getGetGlossaryQueryKey() })
	const onError = () => toast.error(t('admin.glossary.save_failed'))

	const { mutateAsync: createTerm, isPending: creating } =
		useCreateGlossaryTerm({ mutation: { onSuccess: refresh, onError } })
	const { mutate: updateTerm } = useUpdateGlossaryTerm({
		mutation: { onSuccess: refresh, onError },
	})
	const { mutate: deleteTerm } = useDeleteGlossaryTerm({
		mutation: { onSuccess: refresh, onError },
	})

	return {
		terms,
		isLoading,
		creating,
		create: (data: SaveGlossaryTermDto) => createTerm({ data }),
		update: (id: string, data: SaveGlossaryTermDto) => updateTerm({ id, data }),
		remove: (id: string) => deleteTerm({ id }),
	}
}
