import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { TablePickerModal } from '../@TablePickerModal'
import { OrderConfigModal } from '../@OrderConfigModal'
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
		pickerOpen,
		setPickerOpen,
		openPicker,
		configOpen,
		setConfigOpen,
		tableId,
		selectTable,
		changeTable,
		handleDone,
		updateFood,
		updateVariant,
	} = useFoodDetail(id ?? undefined)

	return (
		<>
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
							onAdd={openPicker}
							onUpdateFood={updateFood}
							onUpdateVariant={updateVariant}
							variant='modal'
						/>
					)}
				</DialogContent>
			</Dialog>

			<TablePickerModal
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				onSelect={selectTable}
			/>

			<OrderConfigModal
				open={configOpen}
				onOpenChange={setConfigOpen}
				tableId={tableId}
				foods={
					food
						? [
								{
									id: food.id,
									name: food.name,
									defaultVariantId: availableVariants[0]?.id ?? null,
									variants: availableVariants,
								},
							]
						: []
				}
				onSuccess={handleDone}
				onChangeTable={changeTable}
			/>
		</>
	)
}
