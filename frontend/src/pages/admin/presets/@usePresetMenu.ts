import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useQueryClient } from '@tanstack/react-query'
import {
	useGetPresetMenus,
	useCreatePresetMenu,
	useUpdatePresetMenu,
	useDeletePresetMenu,
	useAddPresetMenuItem,
	useUpdatePresetMenuItem,
	useRemovePresetMenuItem,
	getGetPresetMenusQueryKey,
} from '@/api/preset-menus/preset-menus'
import { useCreateFood } from '@/api/foods/foods'
import { useGetCategories } from '@/api/categories/categories'
import type {
	CategoryItemDto,
	PresetMenuDto,
	UpdatePresetDto,
} from '@/api/model'
import { useToast } from '@/hooks/useToast'

export function usePresetMenu() {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()

	const [activeId, setActiveId] = React.useState<string | null>(null)

	const { data: presets = [], isLoading } = useGetPresetMenus<PresetMenuDto[]>(
		{ lang: i18n.language },
		{ query: { placeholderData: keepPreviousData } }
	)

	const selectedPreset =
		presets.find(p => p.id === activeId) ?? presets[0] ?? null

	const presetsKey = getGetPresetMenusQueryKey({ lang: i18n.language })

	const invalidate = () =>
		qc.invalidateQueries({ queryKey: getGetPresetMenusQueryKey() })

	const onError = () => toast.error(t('admin.presets.save_failed'))

	/** Paints the change immediately; the snapshot is restored if the save fails. */
	const patchPresets = async (
		apply: (presets: PresetMenuDto[]) => PresetMenuDto[]
	) => {
		await qc.cancelQueries({ queryKey: presetsKey })
		const prev = qc.getQueryData<PresetMenuDto[]>(presetsKey)
		if (prev) qc.setQueryData<PresetMenuDto[]>(presetsKey, apply(prev))
		return { prev }
	}

	const patchPreset = (
		id: string,
		apply: (preset: PresetMenuDto) => PresetMenuDto
	) => patchPresets(list => list.map(p => (p.id === id ? apply(p) : p)))

	const optimistic = {
		onError: (
			_e: unknown,
			_v: unknown,
			ctx: { prev?: PresetMenuDto[] } | undefined
		) => {
			if (ctx?.prev) qc.setQueryData(presetsKey, ctx.prev)
			onError()
		},
		onSettled: invalidate,
	}

	const { mutate: createMutate, isPending: creating } = useCreatePresetMenu({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: updateMutate } = useUpdatePresetMenu({
		mutation: {
			onMutate: ({ id, data: { price, isActive, note } }) =>
				patchPreset(id, p => ({
					...p,
					...(price !== undefined && { price }),
					...(isActive !== undefined && { isActive }),
					...(note !== undefined && { note: note || null }),
				})),
			...optimistic,
		},
	})
	const { mutate: deleteMutate } = useDeletePresetMenu({
		mutation: {
			onMutate: ({ id }) => patchPresets(list => list.filter(p => p.id !== id)),
			...optimistic,
		},
	})
	const { mutate: addItemMutate } = useAddPresetMenuItem({
		mutation: { onSuccess: invalidate, onError },
	})
	const { data: categories = [] } = useGetCategories<CategoryItemDto[]>(
		{ lang: i18n.language },
		{ query: { placeholderData: keepPreviousData } }
	)
	const { mutateAsync: createFoodAsync, isPending: creatingFood } =
		useCreateFood({
			mutation: { onError },
		})
	const { mutate: updateItemMutate } = useUpdatePresetMenuItem({
		mutation: {
			onMutate: ({ id, variantId, data: { quantity } }) =>
				patchPreset(id, p => ({
					...p,
					items: p.items.map(item =>
						item.variantId === variantId ? { ...item, quantity } : item
					),
				})),
			...optimistic,
		},
	})
	const { mutate: removeItemMutate } = useRemovePresetMenuItem({
		mutation: {
			onMutate: ({ id, variantId }) =>
				patchPreset(id, p => ({
					...p,
					items: p.items.filter(item => item.variantId !== variantId),
				})),
			...optimistic,
		},
	})

	const setQuantity = (presetId: string, variantId: string, quantity: number) =>
		updateItemMutate({ id: presetId, variantId, data: { quantity } })

	const createFood = (
		presetId: string,
		name: string,
		categoryId: string,
		price: number,
		imageUrl?: string
	) =>
		createFoodAsync({
			data: {
				name,
				categoryId,
				imageUrl,
				lang: i18n.language,
				variants: [{ label: t('admin.food.default_variant_label'), price }],
			},
		}).then(food => {
			const variantId = food.variants[0]?.id
			if (variantId)
				addItemMutate({ id: presetId, data: { variantId, quantity: 1 } })
		})

	return {
		categories,
		creatingFood,
		createFood,
		presets,
		isLoading,
		creating,
		selectedPreset,
		setActiveId,
		createPreset: (price: number) =>
			createMutate({ data: { price, isActive: false } }),
		updatePreset: (id: string, patch: Omit<UpdatePresetDto, 'lang'>) =>
			updateMutate({ id, data: { ...patch, lang: i18n.language } }),
		deletePreset: (id: string) => deleteMutate({ id }),
		addItem: (presetId: string, variantId: string) =>
			addItemMutate({ id: presetId, data: { variantId, quantity: 1 } }),
		removeItem: (presetId: string, variantId: string) =>
			removeItemMutate({ id: presetId, variantId }),
		setQuantity,
	}
}
