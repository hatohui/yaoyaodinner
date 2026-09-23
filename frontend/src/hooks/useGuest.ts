import { create } from 'zustand'
import { localStorage } from '@/utils/localstorage'
import {
	PIN_STORAGE_KEY,
	EVENT_ID_STORAGE_KEY,
	GUEST_NAME_STORAGE_KEY,
	ME_STORAGE_KEY,
} from '@/common/constants'

/** The roster person this device belongs to. */
export interface Me {
	id: string
	name: string
	tableId: string | null
	pfpUrl: string | null
}

const loadMe = (): Me | null => {
	const raw = localStorage.load(ME_STORAGE_KEY)
	if (!raw) return null
	try {
		return JSON.parse(raw) as Me
	} catch {
		return null
	}
}

interface GuestState {
	pin: string | null
	eventId: string | null
	name: string | null
	me: Me | null
	setAuth: (pin: string, eventId: string) => void
	setName: (name: string) => void
	setMe: (me: Me) => void
	clearMe: () => void
	clear: () => void
}

export const useGuest = create<GuestState>(set => ({
	pin: localStorage.load(PIN_STORAGE_KEY),
	eventId: localStorage.load(EVENT_ID_STORAGE_KEY),
	name: localStorage.load(GUEST_NAME_STORAGE_KEY),
	me: loadMe(),
	setAuth: (pin, eventId) => {
		localStorage.save(PIN_STORAGE_KEY, pin)
		localStorage.save(EVENT_ID_STORAGE_KEY, eventId)
		set({ pin, eventId })
	},
	setName: name => {
		localStorage.save(GUEST_NAME_STORAGE_KEY, name)
		set({ name })
	},
	setMe: me => {
		localStorage.save(ME_STORAGE_KEY, JSON.stringify(me))
		localStorage.save(GUEST_NAME_STORAGE_KEY, me.name)
		set({ me, name: me.name })
	},
	clearMe: () => {
		localStorage.remove(ME_STORAGE_KEY)
		set({ me: null })
	},
	clear: () => {
		localStorage.remove(PIN_STORAGE_KEY)
		localStorage.remove(EVENT_ID_STORAGE_KEY)
		// people belong to an event, so a new PIN means a new roster
		localStorage.remove(ME_STORAGE_KEY)
		set({ pin: null, eventId: null, me: null })
	},
}))
