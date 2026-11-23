import { useTranslation } from 'react-i18next'
import { useGetFoods } from '@/api/foods/foods'
import type { FoodItemDto, GetFoodsResponseDto } from '@/api/model'
import { STALE_TIME_STATIC } from '@/common/constants'
import { awaitingPrice } from '@/utils/money'

const POPULAR_COUNT = 8

/** Popular dishes that can go straight into the plan. */
export function usePopularFoods(enabled = true) {
	const { i18n } = useTranslation()
	const { data } = useGetFoods<GetFoodsResponseDto>(
		{ lang: i18n.language, page: 1, count: POPULAR_COUNT, popular: true },
		{ query: { enabled, staleTime: STALE_TIME_STATIC } }
	)
	return (data?.foods ?? []).filter(f => f.defaultVariantId)
}

export function useFoodPriceLabel() {
	const { t } = useTranslation()
	return (food: FoodItemDto) => {
		if (!food.shouldCalculate) return t('orders.free')
		if (awaitingPrice(food)) return t('menu.seasonal_price')
		const amount =
			`${(food.price ?? 0).toFixed(2)} ${food.currency ?? ''}`.trim()
		return food.variantCount > 1 ? t('orders.from_amount', { amount }) : amount
	}
}
