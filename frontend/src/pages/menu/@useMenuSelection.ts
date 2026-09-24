import { useState } from 'react'
import { create } from 'zustand'
import type { FoodItemDto } from '@/api/model'
import { useGuest } from '@/hooks/useGuest'

interface MenuBasketState {
	selected: Set<string>
	toggle: (foodId: string) => void
	clear: () => void
}

// lives outside the page component so quick-viewing a dish (which navigates
// to /menu/:id and back) doesn't unmount MenuPage and wipe the selection
const useMenuBasketStore = create<MenuBasketState>(set => ({
	selected: new Set(),
	toggle: foodId =>
		set(s => {
			const next = new Set(s.selected)
			if (next.has(foodId)) next.delete(foodId)
			else next.add(foodId)
			return { selected: next }
		}),
	clear: () => set({ selected: new Set() }),
}))

export function useMenuSelection(foods: FoodItemDto[]) {
	const selected = useMenuBasketStore(s => s.selected)
	const toggle = useMenuBasketStore(s => s.toggle)
	const clear = useMenuBasketStore(s => s.clear)
	const [pickerOpen, setPickerOpen] = useState(false)
	const [configOpen, setConfigOpen] = useState(false)
	const [tableId, setTableId] = useState<string | null>(null)
	const myTableId = useGuest(s => s.me?.tableId ?? null)

	const selectTable = (id: string) => {
		setTableId(id)
		setPickerOpen(false)
		setConfigOpen(true)
	}

	// once you've said who you are, your table is the obvious default
	const openPicker = () => {
		if (selected.size === 0) return
		if (myTableId) selectTable(myTableId)
		else setPickerOpen(true)
	}

	const changeTable = () => {
		setConfigOpen(false)
		setPickerOpen(true)
	}

	const handleDone = () => {
		setConfigOpen(false)
		clear()
	}

	return {
		selected,
		toggle,
		clear,
		count: selected.size,
		pickerOpen,
		setPickerOpen,
		openPicker,
		configOpen,
		setConfigOpen,
		tableId,
		selectTable,
		changeTable,
		selectedFoods: foods.filter(f => selected.has(f.id)),
		handleDone,
	}
}
