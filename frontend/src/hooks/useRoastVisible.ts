import { create } from 'zustand'
import { localStorage } from '@/utils/localstorage'
import { TABLE_ROAST_VISIBLE_STORAGE_KEY } from '@/common/constants'

interface RoastVisibleState {
	visible: boolean
	toggle: () => void
	show: () => void
}

export const useRoastVisible = create<RoastVisibleState>(set => ({
	visible: localStorage.load(TABLE_ROAST_VISIBLE_STORAGE_KEY) === 'true',
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
}))
