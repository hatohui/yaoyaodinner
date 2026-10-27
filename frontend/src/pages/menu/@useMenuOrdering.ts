import { useEffect, useMemo, useState } from 'react'
import { create } from 'zustand'
import { useGetOrders } from '@/api/orders/orders'
import { useGetTableById } from '@/api/tables/tables'
import type { FoodItemDto, OrderResponseDto, TableDto } from '@/api/model'
import { groupOrders } from '@/components/ordering/groupOrders'
import type { SidePanelTab } from '@/components/ordering/OrderSidePanel'
import { useGuest } from '@/hooks/useGuest'
import { useOrderCart } from '@/hooks/useOrderCart'
import { useHeldTableCode, useTableAccess } from '@/hooks/useTableCode'

interface MenuOrderingState {
	pickedTableId: string | null
	/** A dish waiting to be configured, once there's a table that can take it. */
	pending: FoodItemDto | null
	pickTable: (tableId: string) => void
	request: (food: FoodItemDto) => void
	settle: () => void
}

// lives outside the page so the dish page (/menu/:id) can hand a dish back to it
export const useMenuOrderingStore = create<MenuOrderingState>(set => ({
	pickedTableId: null,
	pending: null,
	pickTable: tableId => set({ pickedTableId: tableId }),
	request: food => set({ pending: food }),
	settle: () => set({ pending: null }),
}))

export function useMenuOrdering() {
	const claimedTableId = useGuest(s => s.me?.tableId ?? null)
	const heldTableId = useHeldTableCode(s => s.held?.tableId ?? null)
	const pickedTableId = useMenuOrderingStore(s => s.pickedTableId)
	const pending = useMenuOrderingStore(s => s.pending)
	const pickTable = useMenuOrderingStore(s => s.pickTable)
	const request = useMenuOrderingStore(s => s.request)
	const settle = useMenuOrderingStore(s => s.settle)

	// who you've claimed, or the table whose code you hold, decides where you order
	const fixedTableId = claimedTableId ?? heldTableId
	const tableId = fixedTableId ?? pickedTableId ?? ''
	const { canEdit } = useTableAccess(tableId)
	const cart = useOrderCart(tableId)

	const { data: table } = useGetTableById<TableDto>(tableId, {
		query: { enabled: Boolean(tableId) },
	})
	const { data: orders = [] } = useGetOrders<OrderResponseDto[]>(
		{ tableId },
		{ query: { enabled: Boolean(tableId) } }
	)
	const orderedLines = useMemo(() => groupOrders(orders), [orders])
	const orderedByFood = useMemo(() => {
		const counts = new Map<string, number>()
		for (const o of orders)
			counts.set(o.foodId, (counts.get(o.foodId) ?? 0) + o.quantity)
		return counts
	}, [orders])

	const [pickerOpen, setPickerOpen] = useState(false)
	const [configuring, setConfiguring] = useState<FoodItemDto | null>(null)
	const [sheetOpen, setSheetOpen] = useState(false)
	const [panelTab, setPanelTab] = useState<SidePanelTab>('cart')

	useEffect(() => {
		if (!pending) return
		if (!tableId) setPickerOpen(true)
		else if (canEdit) {
			setConfiguring(pending)
			settle()
		}
	}, [pending, tableId, canEdit, settle])

	const selectTable = (id: string) => {
		pickTable(id)
		setPickerOpen(false)
	}

	const closePicker = (open: boolean) => {
		setPickerOpen(open)
		if (!open) settle()
	}

	const openSheet = () => {
		setPanelTab(cart.itemCount > 0 ? 'cart' : 'ordered')
		setSheetOpen(true)
	}

	const changeTable = () => {
		setSheetOpen(false)
		setPickerOpen(true)
	}

	const checkout = async () => {
		// land on what was just ordered so people can see it went through
		if (await cart.checkout()) setPanelTab('ordered')
	}

	return {
		tableId,
		table,
		cart,
		orderedLines,
		orderedQuantityOf: (foodId: string) => orderedByFood.get(foodId) ?? 0,
		request,
		locked: Boolean(pending && tableId && !canEdit),
		settle,
		pickerOpen,
		closePicker,
		selectTable,
		canChangeTable: !fixedTableId,
		changeTable,
		configuring,
		closeConfig: () => setConfiguring(null),
		sheetOpen,
		setSheetOpen,
		openSheet,
		panelTab,
		setPanelTab,
		checkout,
	}
}

export type MenuOrdering = ReturnType<typeof useMenuOrdering>
