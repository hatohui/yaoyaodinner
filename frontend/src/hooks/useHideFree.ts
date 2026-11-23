import { useState } from 'react'
import { ORDER_HIDE_FREE_STORAGE_KEY } from '@/common/constants'
import { localStorage } from '@/utils/localstorage'

const loadHideFree = () => {
	try {
		return localStorage.load(ORDER_HIDE_FREE_STORAGE_KEY) === 'true'
	} catch {
		return false
	}
}

/** Whether free dishes are hidden from the order list, remembered on this device. */
export function useHideFree() {
	const [hideFree, setHideFree] = useState(loadHideFree)

	const toggleHideFree = () =>
		setHideFree(prev => {
			const next = !prev
			try {
				localStorage.save(ORDER_HIDE_FREE_STORAGE_KEY, String(next))
			} catch {
				// storage can be blocked; the toggle still works for this visit
			}
			return next
		})

	return { hideFree, toggleHideFree }
}
