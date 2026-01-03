import { FoodService } from '@/services/food-service'
import type { GetFoodsParams } from '@/types/dtos/foods/getFoods'
import { useQuery } from '@tanstack/react-query'

export const useFoods = (params: GetFoodsParams = {}) => {
	return useQuery({
		queryKey: ['foods', params],
		queryFn: () => FoodService.getFoods(params),
		staleTime: 5 * 60 * 1000,
	})
}
