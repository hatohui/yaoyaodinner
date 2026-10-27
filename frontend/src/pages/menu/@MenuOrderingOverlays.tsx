import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { AddToCartModal } from '@/components/ordering/AddToCartModal'
import { CartPanel } from '@/components/ordering/CartPanel'
import { OrderedList } from '@/components/ordering/OrderedList'
import { OrderSidePanel } from '@/components/ordering/OrderSidePanel'
import { TableCodeForm } from '@/components/common/TableCodeForm'
import { useConfig } from '@/hooks/useConfig'
import { SelectionBar } from './@SelectionBar'
import { TablePickerModal } from './@TablePickerModal'
import type { MenuOrdering } from './@useMenuOrdering'

export function MenuOrderingOverlays({
	ordering,
	canOrder,
}: {
	ordering: MenuOrdering
	canOrder: boolean
}) {
	const { t } = useTranslation()
	const { tableCodes } = useConfig()
	const { cart, table } = ordering

	return (
		<>
			{canOrder && (
				<SelectionBar
					count={cart.itemCount}
					orderedCount={ordering.orderedLines.length}
					onClear={cart.clear}
					onOpen={ordering.openSheet}
				/>
			)}

			<Dialog open={ordering.sheetOpen} onOpenChange={ordering.setSheetOpen}>
				<DialogContent className='scrollbar-thin max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-lg max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:p-4 max-sm:pb-6 max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=closed]:zoom-out-100 max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=open]:zoom-in-100'>
					<DialogHeader className='flex-row flex-wrap items-center gap-x-2 pr-6 text-left'>
						<DialogTitle className='text-base'>
							{table
								? t('orders.ordering_for', {
										table: `${table.no}. ${table.name}`,
									})
								: t('orders.cart')}
						</DialogTitle>
						{ordering.canChangeTable && (
							<button
								type='button'
								onClick={ordering.changeTable}
								className='cursor-pointer text-sm font-medium text-primary hover:underline'
							>
								{t('menu.change_table')}
							</button>
						)}
					</DialogHeader>
					<OrderSidePanel
						tab={ordering.panelTab}
						onTabChange={ordering.setPanelTab}
						cartCount={cart.itemCount}
						orderedCount={ordering.orderedLines.length}
						cart={
							<CartPanel
								lines={cart.lines}
								people={cart.people}
								myPersonId={cart.myPersonId}
								total={cart.total}
								currency={cart.currency}
								isPlacing={cart.isPlacing}
								onQuantityChange={cart.setQuantity}
								onModeChange={cart.setMode}
								onTogglePerson={cart.togglePerson}
								onVariantChange={cart.setVariant}
								onRemove={cart.remove}
								onClear={cart.clear}
								onCheckout={ordering.checkout}
							/>
						}
						ordered={
							<OrderedList lines={ordering.orderedLines} people={cart.people} />
						}
					/>
				</DialogContent>
			</Dialog>

			<TablePickerModal
				open={ordering.pickerOpen}
				onOpenChange={ordering.closePicker}
				onSelect={ordering.selectTable}
			/>

			<Dialog
				open={ordering.locked}
				onOpenChange={open => !open && ordering.settle()}
			>
				<DialogContent className='rounded-3xl'>
					<DialogHeader className='items-center text-center'>
						<div className='flex size-12 items-center justify-center rounded-2xl bg-brand-muted text-primary'>
							<Lock className='size-5' />
						</div>
						<DialogTitle>
							{tableCodes
								? t('table_code.title')
								: t('table_code.not_your_table')}
						</DialogTitle>
						{tableCodes && (
							<DialogDescription>{t('table_code.subtitle')}</DialogDescription>
						)}
					</DialogHeader>
					{tableCodes && <TableCodeForm tableId={ordering.tableId} autoFocus />}
				</DialogContent>
			</Dialog>

			<AddToCartModal
				open={Boolean(ordering.configuring)}
				onOpenChange={open => !open && ordering.closeConfig()}
				food={ordering.configuring}
				tableId={ordering.tableId}
				onAdd={cart.addConfigured}
			/>
		</>
	)
}
