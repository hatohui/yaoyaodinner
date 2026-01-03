import axios from '@/common/axios'
import type {
	GetFoodsParams,
	GetFoodsResponse,
} from '@/types/dtos/foods/getFoods'

export const FoodService = {
	getFoods: async (params: GetFoodsParams = {}): Promise<GetFoodsResponse> => {
		const { lang = 'en', page = 1, count = 20, category = 'all' } = params

		const response = await axios.get<GetFoodsResponse>('/foods', {
			params: {
				lang,
				page,
				count,
				category,
			},
		})

		return response.data
	},
}
