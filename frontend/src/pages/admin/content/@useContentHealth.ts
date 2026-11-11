import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
	fillAllContent,
	fillCategoryContent,
	getGetContentHealthQueryKey,
	useGetContentHealth,
} from '@/api/content-health/content-health'
import { getGetFoodsForAdminQueryKey, updateFood } from '@/api/foods/foods'
import { getGetCategoriesQueryKey } from '@/api/categories/categories'
import type { ContentHealthDto, FillAllContentDtoTab } from '@/api/model'
import { useAiJobs } from '@/hooks/useAiJobs'
import { useToast } from '@/hooks/useToast'

export type ContentTab =
	| 'translations'
	| 'descriptions'
	| 'images'
	| 'categories'

export function useContentHealth() {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()

	const { data, isLoading } = useGetContentHealth<ContentHealthDto>({
		lang: i18n.language,
	})

	const refresh = React.useCallback(() => {
		qc.invalidateQueries({ queryKey: getGetContentHealthQueryKey() })
		qc.invalidateQueries({ queryKey: getGetFoodsForAdminQueryKey() })
		qc.invalidateQueries({ queryKey: getGetCategoriesQueryKey() })
	}, [qc])

	const jobs = useAiJobs({
		onSettled: (_id, status) => {
			if (status === 'done') toast.success(t('admin.content.fill_done'))
			else toast.error(t('admin.content.fill_failed'))
			refresh()
		},
		onBatchProgress: refresh,
		onBatchSettled: batch => {
			refresh()
			if (batch.total > 0 && batch.failed === batch.total)
				toast.error(t('admin.content.fill_failed'))
			else if (batch.failed > 0)
				toast.warning(t('admin.content.fill_partial', { count: batch.failed }))
			else toast.success(t('admin.content.fill_all_done'))
		},
	})

	const fillCategory = async (id: string) => {
		try {
			await fillCategoryContent(id)
			jobs.watch(id)
		} catch {
			toast.error(t('admin.content.fill_failed'))
		}
	}

	const fillAll = async (tab: FillAllContentDtoTab) => {
		try {
			const batch = await fillAllContent({ tab })
			if (batch.total > 0) jobs.watchBatch(batch)
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 409)
				toast.info(t('admin.content.batch_running'))
			else toast.error(t('admin.content.fill_failed'))
		}
	}

	const setImage = async (foodId: string, imageUrl: string | null) => {
		if (!imageUrl) return
		try {
			await updateFood(foodId, { imageUrl, lang: i18n.language })
			toast.success(t('admin.content.image_saved'))
		} catch {
			toast.error(t('admin.food.save_failed'))
		}
		refresh()
	}

	const foods = data?.foods ?? []
	const lists = {
		translations: foods.filter(f => f.missingTranslations.length > 0),
		descriptions: foods.filter(f => f.missingDescription),
		images: foods.filter(f => f.missingImage),
		categories: data?.categories ?? [],
	}

	return {
		isLoading,
		lists,
		pendingIds: jobs.pendingIds,
		batch: jobs.batch,
		fillCategory,
		refresh,
		fillAll,
		setImage,
	}
}
