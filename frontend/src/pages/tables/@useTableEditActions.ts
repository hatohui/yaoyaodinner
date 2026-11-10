import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useCreateTable,
	useUpdateTable,
	useSwapTableNumbers,
	useDeleteTable,
	useUpdateTableDetails,
} from '@/api/tables/tables'
import { useToast } from '@/hooks/useToast'

const isTableQuery = (key: readonly unknown[]) =>
	typeof key[0] === 'string' && key[0].startsWith('/api/tables')

export function useTableEditActions() {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const invalidate = () =>
		qc.invalidateQueries({ predicate: q => isTableQuery(q.queryKey) })

	const { mutate: create, isPending: creating } = useCreateTable({
		mutation: {
			meta: { ownErrorToast: true },
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.tables.created'))
			},
			onError: () => toast.error(t('admin.tables.create_failed')),
		},
	})

	const { mutate: update } = useUpdateTable({
		mutation: {
			meta: { ownErrorToast: true },
			onError: () => toast.error(t('admin.tables.rename_failed')),
			onSettled: invalidate,
		},
	})

	const { mutate: updateDetails } = useUpdateTableDetails({
		mutation: {
			meta: { ownErrorToast: true },
			onError: () => toast.error(t('roster.update_failed')),
			onSettled: invalidate,
		},
	})

	const { mutate: swap } = useSwapTableNumbers({
		mutation: {
			meta: { ownErrorToast: true },
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.tables.numbers_swapped'))
			},
			onError: () => toast.error(t('admin.tables.swap_failed')),
		},
	})

	const { mutate: remove } = useDeleteTable({
		mutation: {
			meta: { ownErrorToast: true },
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.tables.deleted'))
			},
			onError: () => toast.error(t('admin.tables.delete_failed')),
		},
	})

	return {
		creating,
		createTable: (name: string, capacity: number, isStaging: boolean) =>
			create({ data: { name, capacity, isStaging } }),
		renameTable: (id: string, name: string) => update({ id, data: { name } }),
		updateCapacity: (id: string, capacity: number) =>
			update({ id, data: { capacity } }),
		updateBanner: (id: string, bannerUrl: string | null) =>
			updateDetails({ id, data: { bannerUrl } }),
		swapNumbers: (a: string, b: string) => swap({ data: { ids: [a, b] } }),
		deleteTable: (id: string) => remove({ id }),
	}
}
