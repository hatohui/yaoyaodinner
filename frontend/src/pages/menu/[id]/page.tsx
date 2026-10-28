import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
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
			<div className='mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6'>
				<div className='flex items-center justify-between'>
					<Skeleton className='h-4 w-28 rounded-full' />
					<Skeleton className='h-8 w-28 rounded-full' />
				</div>
				<Skeleton className='aspect-[4/3] w-full rounded-2xl' />
				<Skeleton className='h-5 w-24 rounded-full bg-primary/15' />
				<Skeleton className='h-8 w-2/3 rounded-full' />
				<Skeleton className='h-4 w-full rounded-full' />
				<Skeleton className='h-4 w-4/5 rounded-full' />
				<div className='flex gap-2'>
					<Skeleton className='h-9 w-28 rounded-full' />
					<Skeleton className='h-9 w-28 rounded-full' />
				</div>
				<Skeleton className='h-11 w-full rounded-full bg-primary/15' />
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
