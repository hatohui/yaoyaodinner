import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { FoodDetailView } from './@FoodDetailView'
import { useFoodDetail } from './@useFoodDetail'

interface FoodDetailModalProps {
	id: string | null
	onOpenChange: (open: boolean) => void
}

export function FoodDetailModal({ id, onOpenChange }: FoodDetailModalProps) {
	const { t } = useTranslation()
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
	} = useFoodDetail(id ?? undefined)

	return (
		<Dialog open={Boolean(id)} onOpenChange={onOpenChange}>
			<DialogContent className='scrollbar-thin max-h-[85vh] gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-3xl md:overflow-hidden'>
				<DialogTitle className='sr-only'>
					{food?.name ?? t('food_detail.title')}
				</DialogTitle>
				{isLoading ? (
					<div className='flex justify-center py-20'>
						<Spinner />
					</div>
				) : isError || !food ? (
					<p className='py-20 text-center text-sm text-muted-foreground'>
						{t('food_detail.not_found')}
					</p>
				) : (
					<FoodDetailView
						food={food}
						availableVariants={availableVariants}
						selectedVariantId={selectedVariantId}
						onSelectVariant={selectVariant}
						onAddToCart={() => {
							addToCart()
							onOpenChange(false)
						}}
						onUpdateFood={updateFood}
						onUpdateVariant={updateVariant}
						variant='modal'
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
