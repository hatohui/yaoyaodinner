import { create } from 'zustand'
import { localStorage } from '@/utils/localstorage'
import { IDENTITY_TOUR_STORAGE_KEY } from '@/common/constants'

export type TourPath = 'search' | 'browse'

interface IdentityTourState {
	open: boolean
	path: TourPath | null
	query: string
	start: () => void
	startForEvent: (eventId: string) => void
	choose: (path: TourPath | null) => void
	setQuery: (query: string) => void
	finish: () => void
}

export const useIdentityTour = create<IdentityTourState>((set, get) => ({
	open: false,
	path: null,
	query: '',
	start: () => set({ open: true, path: null }),
	// a new event PIN means a new roster, so the tour comes back once per event
	startForEvent: eventId => {
		if (localStorage.load(IDENTITY_TOUR_STORAGE_KEY) === eventId) return
		localStorage.save(IDENTITY_TOUR_STORAGE_KEY, eventId)
		get().start()
	},
	choose: path => set({ path }),
	setQuery: query => set({ query: query.trim() }),
	finish: () => set({ open: false, path: null }),
}))
