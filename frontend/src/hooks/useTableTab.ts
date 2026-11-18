import { useCallback, useState } from 'react'
import { localStorage } from '@/utils/localstorage'
import { TABLE_TAB_STORAGE_KEY } from '@/common/constants'

export type TableTab = 'people' | 'plan' | 'orders'

const DEFAULT_TAB: TableTab = 'people'
const TABS: TableTab[] = ['people', 'plan', 'orders']

type TabMap = Record<string, TableTab>

const normalizeTab = (value?: string | null): TableTab | null => {
	if (value === 'split') return 'orders'
	if (value && TABS.includes(value as TableTab)) return value as TableTab
	return null
}

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
	const [tab, setTabState] = useState<TableTab>(
		() => normalizeTab(readMap()[tableId]) ?? DEFAULT_TAB
	)

	const setTab = useCallback(
		(next: string) => {
			const normalized = normalizeTab(next)
			if (!normalized) return
			const map = readMap()
			map[tableId] = normalized
			localStorage.save(TABLE_TAB_STORAGE_KEY, JSON.stringify(map))
			setTabState(normalized)
		},
		[tableId]
	)

	return { tab, setTab }
}
