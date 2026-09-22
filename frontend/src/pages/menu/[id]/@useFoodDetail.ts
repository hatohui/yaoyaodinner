import { useState } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useGetFoodById,
	useUpdateFood,
	useUpdateFoodVariant,
	getGetFoodByIdQueryKey,
} from '@/api/foods/foods'
import { STALE_TIME_STATIC } from '@/common/constants'
import type { FoodDetailDto, UpdateFoodDto } from '@/api/model'
import { useToast } from '@/hooks/useToast'

export function useFoodDetail(idOverride?: string) {
	const { id: idParam = '' } = useParams()
	const id = idOverride ?? idParam
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const [pickerOpen, setPickerOpen] = useState(false)
	const [configOpen, setConfigOpen] = useState(false)
	const [tableId, setTableId] = useState<string | null>(null)

	const {
		data: food,
		isLoading,
		isError,
	} = useGetFoodById<FoodDetailDto>(
		id,
		{ lang: i18n.language },
		{
			query: {
				staleTime: STALE_TIME_STATIC,
				refetchOnWindowFocus: false,
				enabled: Boolean(id),
			},
		}
	)

	const availableVariants = (food?.variants ?? []).filter(v => v.isAvailable)

	const invalidate = () =>
		qc.invalidateQueries({
			queryKey: getGetFoodByIdQueryKey(id, { lang: i18n.language }),
		})
	const onError = () => toast.error(t('admin.food.save_failed'))

	const { mutate: updateFoodMutate } = useUpdateFood({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: updateVariantMutate } = useUpdateFoodVariant({
		mutation: { onSuccess: invalidate, onError },
	})

	const openPicker = () => {
		if (availableVariants.length === 0) return
		setPickerOpen(true)
	}

	const selectTable = (id: string) => {
		setTableId(id)
		setPickerOpen(false)
		setConfigOpen(true)
	}

	const handleDone = () => setConfigOpen(false)

	return {
		id,
		food,
		isLoading,
		isError,
		availableVariants,
		pickerOpen,
		setPickerOpen,
		openPicker,
		configOpen,
		setConfigOpen,
		tableId,
		selectTable,
		handleDone,
		updateFood: (patch: UpdateFoodDto) =>
			updateFoodMutate({ id, data: { ...patch, lang: i18n.language } }),
		updateVariant: (
			variantId: string,
			patch: { label?: string; price?: number }
		) =>
			updateVariantMutate({
				variantId,
				data: { ...patch, lang: i18n.language },
			}),
	}
}
