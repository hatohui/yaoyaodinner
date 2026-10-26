import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
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

	const { data: presets = [], isLoading } = useGetPresetMenus<PresetMenuDto[]>({
		lang: i18n.language,
	})

	const selectedPreset =
		presets.find(p => p.id === activeId) ?? presets[0] ?? null

	const invalidate = () =>
		qc.invalidateQueries({ queryKey: getGetPresetMenusQueryKey() })

	const onError = () => toast.error(t('admin.presets.save_failed'))

	const { mutate: createMutate, isPending: creating } = useCreatePresetMenu({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: updateMutate } = useUpdatePresetMenu({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: deleteMutate } = useDeletePresetMenu({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: addItemMutate } = useAddPresetMenuItem({
		mutation: { onSuccess: invalidate, onError },
	})
	const { data: categories = [] } = useGetCategories<CategoryItemDto[]>({
		lang: i18n.language,
	})
	const { mutateAsync: createFoodAsync, isPending: creatingFood } =
		useCreateFood({
			mutation: { onError },
		})
	const { mutate: updateItemMutate } = useUpdatePresetMenuItem({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: removeItemMutate } = useRemovePresetMenuItem({
		mutation: { onSuccess: invalidate, onError },
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
