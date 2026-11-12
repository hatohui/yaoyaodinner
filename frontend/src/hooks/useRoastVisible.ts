import { create } from 'zustand'
import { localStorage } from '@/utils/localstorage'
import {
	TABLE_ROAST_SHOW_ALL_STORAGE_KEY,
	TABLE_ROAST_VISIBLE_STORAGE_KEY,
} from '@/common/constants'

interface RoastVisibleState {
	visible: boolean
	showAll: boolean
	toggle: () => void
	show: () => void
	toggleShowAll: () => void
}

export const useRoastVisible = create<RoastVisibleState>(set => ({
	visible: localStorage.load(TABLE_ROAST_VISIBLE_STORAGE_KEY) === 'true',
	showAll: localStorage.load(TABLE_ROAST_SHOW_ALL_STORAGE_KEY) === 'true',
	toggle: () =>
		set(s => {
			localStorage.save(TABLE_ROAST_VISIBLE_STORAGE_KEY, String(!s.visible))
			return { visible: !s.visible }
		}),
	show: () =>
		set(() => {
			localStorage.save(TABLE_ROAST_VISIBLE_STORAGE_KEY, 'true')
			return { visible: true }
		}),
	toggleShowAll: () =>
		set(s => {
			localStorage.save(TABLE_ROAST_SHOW_ALL_STORAGE_KEY, String(!s.showAll))
			return { showAll: !s.showAll }
		}),
}))
