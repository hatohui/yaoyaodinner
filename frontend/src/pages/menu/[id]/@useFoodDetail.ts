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
import type {
	FoodDetailWithStatsDto,
	FoodItemDto,
	UpdateFoodDto,
} from '@/api/model'
import { useToast } from '@/hooks/useToast'
import { useMenuOrderingStore } from '../@useMenuOrdering'

export function useFoodDetail(idOverride?: string) {
	const { id: idParam = '' } = useParams()
	const id = idOverride ?? idParam
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const request = useMenuOrderingStore(s => s.request)
	const [picked, setPicked] = useState<Record<string, string>>({})
	const pickedVariantId = id ? picked[id] : undefined

	const {
		data: food,
		isLoading,
		isError,
	} = useGetFoodById<FoodDetailWithStatsDto>(
		id,
		{ lang: i18n.language },
		{
			query: {
				refetchOnWindowFocus: false,
				enabled: Boolean(id),
			},
		}
	)

	const availableVariants = (food?.variants ?? []).filter(v => v.isAvailable)
	const selectedVariantId =
		availableVariants.find(v => v.id === pickedVariantId)?.id ??
		availableVariants[0]?.id ??
		null

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

	return {
		id,
		food,
		isLoading,
		isError,
		availableVariants,
		selectedVariantId,
		selectVariant: (variantId: string) =>
			setPicked(prev => ({ ...prev, [id]: variantId })),
		addToCart: () => {
			const variant = availableVariants.find(v => v.id === selectedVariantId)
			if (!food || !variant) return
			// the add-to-cart step starts from the portion picked here
			const item: FoodItemDto = {
				id: food.id,
				name: food.name,
				imageUrl: food.imageUrl,
				description: food.description,
				categoryId: food.categoryId,
				isAvailable: food.isAvailable,
				isPopular: food.isPopular,
				isRecommended: food.isRecommended,
				shouldCalculate: food.shouldCalculate,
				defaultVariantId: variant.id,
				price: variant.price,
				currency: variant.currency,
			}
			request(item)
		},
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
