import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useGetFoodsForAdmin,
	useCreateFood,
	useUpdateFood,
	useDeleteFood,
	useBulkToggleFoods,
	useBulkDeleteFoods,
	useAddFoodVariant,
	useUpdateFoodVariant,
	useDeleteFoodVariant,
	getGetFoodsForAdminQueryKey,
} from '@/api/foods/foods'
import { useGetCategories } from '@/api/categories/categories'
import type {
	CategoryItemDto,
	FoodDetailDto,
	GetFoodsForAdminResponseDto,
} from '@/api/model'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { updateFood as apiUpdateFood } from '@/api/foods/foods'

/** Default variant's price/id flattened onto the row so the grid can edit it in place. */
export type FoodGridRow = FoodDetailDto & {
	price: number | null
	currency: string | null
	variantId: string | null
}

export function useFoodCatalog() {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()

	const [search, setSearch] = React.useState('')
	const [categoryId, setCategoryId] = React.useState('all')
	const [total, setTotal] = React.useState(0)
	const debouncedSearch = useDebounce(search, 300)
	const pagination = usePagination({ total, initialCount: 12 })

	const [failedTranslationFood, setFailedTranslationFood] = React.useState<{
		id: string
		name: string
	} | null>(null)

	const { data: categories = [] } = useGetCategories<CategoryItemDto[]>({
		lang: i18n.language,
	})

	const { data, isLoading } = useGetFoodsForAdmin<GetFoodsForAdminResponseDto>({
		lang: i18n.language,
		page: pagination.page,
		count: pagination.count,
		category: categoryId,
		search: debouncedSearch || undefined,
	})
	const foods: FoodGridRow[] = React.useMemo(
		() =>
			(data?.foods ?? []).map(f => ({
				...f,
				price: f.variants[0]?.price ?? null,
				currency: f.variants[0]?.currency ?? null,
				variantId: f.variants[0]?.id ?? null,
			})),
		[data?.foods]
	)

	React.useEffect(() => {
		if (data?.total !== undefined) setTotal(data.total)
	}, [data?.total])

	const listKey = getGetFoodsForAdminQueryKey({
		lang: i18n.language,
		page: pagination.page,
		count: pagination.count,
		category: categoryId,
		search: debouncedSearch || undefined,
	})

	const invalidate = () =>
		qc.invalidateQueries({ queryKey: getGetFoodsForAdminQueryKey() })

	const onError = () => toast.error(t('admin.food.save_failed'))

	/** Paints the inline edit immediately; rolled back by onError. */
	const patchRow = async (
		id: string,
		apply: (row: FoodDetailDto) => FoodDetailDto
	) => {
		await qc.cancelQueries({ queryKey: listKey })
		const prev = qc.getQueryData<GetFoodsForAdminResponseDto>(listKey)
		if (prev)
			qc.setQueryData<GetFoodsForAdminResponseDto>(listKey, {
				...prev,
				foods: prev.foods.map(f => (f.id === id ? apply(f) : f)),
			})
		return { prev }
	}

	const rollback = (ctx?: { prev?: GetFoodsForAdminResponseDto }) => {
		if (ctx?.prev) qc.setQueryData(listKey, ctx.prev)
		onError()
	}

	const { mutate: createFoodMutate, isPending: creating } = useCreateFood({
		mutation: {
			onSuccess: data => {
				invalidate()
				if (data?.aiTranslationFailed)
					setFailedTranslationFood({ id: data.id, name: data.name })
			},
			onError,
		},
	})
	const { mutate: updateFoodMutate } = useUpdateFood({
		mutation: {
			onMutate: ({ id, data: patch }) =>
				patchRow(id, f => ({ ...f, ...patch })),
			onError: (_e, _v, ctx) => rollback(ctx),
			onSettled: invalidate,
		},
	})
	const { mutate: deleteFoodMutate } = useDeleteFood({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: bulkToggleMutate } = useBulkToggleFoods({
		mutation: {
			onMutate: async ({ data: { ids, isAvailable } }) => {
				await qc.cancelQueries({ queryKey: listKey })
				const prev = qc.getQueryData<GetFoodsForAdminResponseDto>(listKey)
				if (prev)
					qc.setQueryData<GetFoodsForAdminResponseDto>(listKey, {
						...prev,
						foods: prev.foods.map(f =>
							ids.includes(f.id) ? { ...f, isAvailable } : f
						),
					})
				return { prev }
			},
			onError: (_e, _v, ctx) => rollback(ctx),
			onSettled: invalidate,
		},
	})
	const { mutate: bulkDeleteMutate } = useBulkDeleteFoods({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: addVariantMutate } = useAddFoodVariant({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: updateVariantMutate } = useUpdateFoodVariant({
		mutation: {
			onMutate: ({ variantId, data: patch }) => {
				const owner = foods.find(f => f.variantId === variantId)
				if (!owner) return undefined
				return patchRow(owner.id, f => ({
					...f,
					variants: f.variants.map(v =>
						v.id === variantId ? { ...v, ...patch } : v
					),
				}))
			},
			onError: (_e, _v, ctx) => rollback(ctx),
			onSettled: invalidate,
		},
	})
	const { mutate: removeVariantMutate } = useDeleteFoodVariant({
		mutation: { onSuccess: invalidate, onError },
	})

	const handleSaveTranslations = React.useCallback(
		async (translations: Record<string, string>) => {
			if (!failedTranslationFood) return
			const id = failedTranslationFood.id

			await Promise.all(
				Object.entries(translations)
					.filter(([, name]) => name.trim())
					.map(([lang, name]) => apiUpdateFood(id, { name, lang }))
			)
			invalidate()
		},
		[failedTranslationFood, invalidate]
	)

	return {
		search,
		setSearch,
		categoryId,
		setCategoryId,
		categories,
		pagination,
		foods,
		isLoading,
		creating,
		failedTranslationFood,
		setFailedTranslationFood,
		handleSaveTranslations,
		createFood: (
			name: string,
			catId: string,
			price: number,
			imageUrl?: string
		) =>
			createFoodMutate({
				data: {
					name,
					categoryId: catId,
					imageUrl,
					lang: i18n.language,
					variants: [{ label: t('admin.food.default_variant_label'), price }],
				},
			}),
		updateFood: (
			id: string,
			patch: Parameters<typeof updateFoodMutate>[0]['data']
		) => updateFoodMutate({ id, data: { ...patch, lang: i18n.language } }),
		deleteFood: (id: string) => deleteFoodMutate({ id }),
		bulkToggle: (ids: string[], isAvailable: boolean) =>
			bulkToggleMutate({ data: { ids, isAvailable } }),
		bulkDelete: (ids: string[]) => bulkDeleteMutate({ data: { ids } }),
		addVariant: (foodId: string, label: string, price: number) =>
			addVariantMutate({
				id: foodId,
				data: { label, price, lang: i18n.language },
			}),
		updateVariant: (
			variantId: string,
			patch: { label?: string; price?: number; isAvailable?: boolean }
		) =>
			updateVariantMutate({
				variantId,
				data: { ...patch, lang: i18n.language },
			}),
		removeVariant: (variantId: string) => removeVariantMutate({ variantId }),
		onDataChange: (updated: FoodGridRow[]) => {
			// Called by DataGrid when a cell is edited inline.
			// We diff against the current snapshot and call updateFood for changed rows.
			for (const next of updated) {
				const prev = foods.find(f => f.id === next.id)
				if (!prev) continue

				// Price/currency live on the variant, not the food, so they patch separately.
				if (prev.variantId) {
					const variantPatch: { price?: number; currency?: string } = {}
					if (prev.price !== next.price && next.price !== null)
						variantPatch.price = Number(next.price)
					if (prev.currency !== next.currency && next.currency)
						variantPatch.currency = next.currency
					if (Object.keys(variantPatch).length > 0)
						updateVariantMutate({
							variantId: prev.variantId,
							data: { ...variantPatch, lang: i18n.language },
						})
				}

				const patch: Record<string, unknown> = {}
				if (prev.name !== next.name) patch.name = next.name
				if (prev.description !== next.description)
					patch.description = next.description ?? ''
				if (prev.categoryId !== next.categoryId)
					patch.categoryId = next.categoryId
				if (prev.isAvailable !== next.isAvailable)
					patch.isAvailable = next.isAvailable
				if (prev.shouldCalculate !== next.shouldCalculate)
					patch.shouldCalculate = next.shouldCalculate
				if (prev.isRecommended !== next.isRecommended)
					patch.isRecommended = next.isRecommended
				if (Object.keys(patch).length > 0)
					updateFoodMutate({
						id: next.id,
						data: { ...patch, lang: i18n.language },
					})
			}
		},
	}
}
