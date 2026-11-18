import { useState } from 'react'
import { PLAN_COLLAPSED_STORAGE_KEY } from '@/common/constants'
import { localStorage } from '@/utils/localstorage'

type CollapsedMap = Record<string, boolean>

const loadCollapsed = (): CollapsedMap => {
	try {
		const raw = localStorage.load(PLAN_COLLAPSED_STORAGE_KEY)
		const parsed: unknown = raw ? JSON.parse(raw) : {}
		return parsed && typeof parsed === 'object' ? (parsed as CollapsedMap) : {}
	} catch {
		return {}
	}
}

/** Which plan sections are folded, remembered on this device. */
export function usePlanCollapse() {
	const [collapsed, setCollapsed] = useState<CollapsedMap>(loadCollapsed)

	const setOpen = (key: string, open: boolean) =>
		setCollapsed(prev => {
			const next = { ...prev, [key]: !open }
			localStorage.save(PLAN_COLLAPSED_STORAGE_KEY, JSON.stringify(next))
			return next
		})

	const section = (key: string) => {
		const open = !collapsed[key]
		return { open, onOpenChange: (next: boolean) => setOpen(key, next) }
	}

	return { section }
}

export type PlanSectionState = ReturnType<
	ReturnType<typeof usePlanCollapse>['section']
>
