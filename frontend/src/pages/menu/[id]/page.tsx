import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { TablePickerModal } from '../@TablePickerModal'
import { OrderConfigModal } from '../@OrderConfigModal'
import { FoodDetailView } from './@FoodDetailView'
import { useFoodDetail } from './@useFoodDetail'

export default function FoodDetailPage() {
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
		<>
			<FoodDetailView
				food={food}
				availableVariants={availableVariants}
				onAdd={openPicker}
				onUpdateFood={updateFood}
				onUpdateVariant={updateVariant}
			/>

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
