import { useCallback, useState } from 'react'
import { localStorage } from '@/utils/localstorage'
import { TABLE_TAB_STORAGE_KEY } from '@/common/constants'

export type TableTab = 'people' | 'orders' | 'split'

const DEFAULT_TAB: TableTab = 'people'
const TABS: TableTab[] = ['people', 'orders', 'split']

type TabMap = Record<string, TableTab>

const readMap = (): TabMap => {
	const raw = localStorage.load(TABLE_TAB_STORAGE_KEY)
	if (!raw) return {}
	try {
		return JSON.parse(raw) as TabMap
	} catch {
		return {}
	}
}

/** Remembers the last tab per table so reopening a table lands where you left it. */
export function useTableTab(tableId: string) {
	const [tab, setTabState] = useState<TableTab>(() => {
		const stored = readMap()[tableId]
		return stored && TABS.includes(stored) ? stored : DEFAULT_TAB
	})

	const setTab = useCallback(
		(next: string) => {
			if (!TABS.includes(next as TableTab)) return
			const map = readMap()
			map[tableId] = next as TableTab
			localStorage.save(TABLE_TAB_STORAGE_KEY, JSON.stringify(map))
			setTabState(next as TableTab)
		},
		[tableId]
	)

	return { tab, setTab }
}
