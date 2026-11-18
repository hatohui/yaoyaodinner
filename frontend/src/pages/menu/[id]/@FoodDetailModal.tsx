import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { FoodDetailView } from './@FoodDetailView'
import { useFoodDetail } from './@useFoodDetail'

interface FoodDetailModalProps {
	id: string | null
	onOpenChange: (open: boolean) => void
	planOnly?: boolean
}

export function FoodDetailModal({
	id,
	onOpenChange,
	planOnly = false,
}: FoodDetailModalProps) {
	const { t } = useTranslation()
	const location = useLocation()
	const navigate = useNavigate()
	const {
		food,
		isLoading,
		isError,
		availableVariants,
		selectedVariantId,
		hasPickedVariant,
		selectVariant,
		addToCart,
		updateFood,
		updateVariant,
	} = useFoodDetail(id ?? undefined)

	return (
		<Dialog open={Boolean(id)} onOpenChange={onOpenChange}>
			<DialogContent className='scrollbar-thin max-h-[85vh] gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-3xl md:overflow-hidden [&>[data-slot=dialog-close]]:top-3 [&>[data-slot=dialog-close]]:right-3 [&>[data-slot=dialog-close]]:z-20 [&>[data-slot=dialog-close]]:flex [&>[data-slot=dialog-close]]:size-8 [&>[data-slot=dialog-close]]:cursor-pointer [&>[data-slot=dialog-close]]:items-center [&>[data-slot=dialog-close]]:justify-center [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:border [&>[data-slot=dialog-close]]:border-border/80 [&>[data-slot=dialog-close]]:bg-card/90 [&>[data-slot=dialog-close]]:text-foreground [&>[data-slot=dialog-close]]:opacity-100 [&>[data-slot=dialog-close]]:shadow-md [&>[data-slot=dialog-close]]:backdrop-blur-sm [&>[data-slot=dialog-close]]:hover:bg-card'>
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
						hasPickedVariant={hasPickedVariant}
						onSelectVariant={selectVariant}
						onAddToCart={() => {
							addToCart()
							onOpenChange(false)
							if (location.pathname !== '/menu') navigate('/menu')
						}}
						onUpdateFood={updateFood}
						onUpdateVariant={updateVariant}
						variant='modal'
						planOnly={planOnly}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
