import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Spinner } from '@/components/ui/spinner'
import { FoodDetailView } from './@FoodDetailView'
import { useFoodDetail } from './@useFoodDetail'

export default function FoodDetailPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const {
		food,
		isLoading,
		isError,
		availableVariants,
		selectedVariantId,
		selectVariant,
		addToCart,
		updateFood,
		updateVariant,
	} = useFoodDetail()

	if (isLoading) {
		return (
			<div className='flex justify-center py-20'>
				<Spinner />
			</div>
		)
	}

	if (isError || !food) {
		return (
			<p className='py-20 text-center text-sm text-muted-foreground'>
				{t('food_detail.not_found')}
			</p>
		)
	}

	return (
		<FoodDetailView
			food={food}
			availableVariants={availableVariants}
			selectedVariantId={selectedVariantId}
			onSelectVariant={selectVariant}
			onAddToCart={() => {
				addToCart()
				navigate('/menu')
			}}
			onUpdateFood={updateFood}
			onUpdateVariant={updateVariant}
		/>
	)
}
