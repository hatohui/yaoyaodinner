import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
	useDeleteFood,
	useUpdateFood,
	getGetFoodsQueryKey,
	getGetFoodsForAdminQueryKey,
} from '@/api/foods/foods'
import { useToast } from '@/hooks/useToast'
import { useEditMode } from '@/hooks/useEditMode'

export function useMenuAdmin() {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const { editing, toggle } = useEditMode()

	const invalidate = () => {
		qc.invalidateQueries({ queryKey: getGetFoodsQueryKey() })
		qc.invalidateQueries({ queryKey: getGetFoodsForAdminQueryKey() })
	}

	const { mutate: remove } = useDeleteFood({
		mutation: {
			onSuccess: () => {
				invalidate()
				toast.success(t('menu.admin.deleted'))
			},
			// Foods that were ever ordered are kept for history; hiding is the way out.
			onError: e =>
				toast.error(
					isAxiosError(e) && e.response?.status === 409
						? t('menu.admin.delete_has_orders')
						: t('menu.admin.delete_failed')
				),
		},
	})

	const { mutate: update } = useUpdateFood({
		mutation: {
			onSuccess: (_d, { data }) => {
				invalidate()
				toast.success(
					data.imageUrl !== undefined
						? t('menu.admin.image_updated')
						: data.isAvailable
							? t('menu.admin.shown')
							: t('menu.admin.hidden')
				)
			},
			onError: () => toast.error(t('menu.admin.update_failed')),
		},
	})

	return {
		editing,
		exitEditMode: toggle,
		deleteFood: (id: string) => remove({ id }),
		setAvailable: (id: string, isAvailable: boolean) =>
			update({ id, data: { isAvailable } }),
		setImage: (id: string, imageUrl: string) =>
			update({ id, data: { imageUrl } }),
	}
}
