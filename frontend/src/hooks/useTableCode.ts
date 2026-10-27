import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { useQuery } from '@tanstack/react-query'
import { useVerifyTableCode, verifyTableCode } from '@/api/tables/tables'
import { localStorage } from '@/utils/localstorage'
import { TABLE_CODE_STORAGE_KEY } from '@/common/constants'
import { useConfig } from '@/hooks/useConfig'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useGuest } from '@/hooks/useGuest'

/** A device holds one table's code at a time, so it can't collect them. */
interface HeldCode {
	tableId: string
	code: string
}

const loadHeld = (): HeldCode | null => {
	const raw = localStorage.load(TABLE_CODE_STORAGE_KEY)
	if (!raw) return null
	try {
		return JSON.parse(raw) as HeldCode
	} catch {
		return null
	}
}

interface TableCodeState {
	held: HeldCode | null
	hold: (held: HeldCode) => void
	release: () => void
}

export const useHeldTableCode = create<TableCodeState>((set, get) => ({
	held: loadHeld(),
	hold: held => {
		localStorage.save(TABLE_CODE_STORAGE_KEY, JSON.stringify(held))
		set({ held })
	},
	release: () => {
		// whoever you claimed at a table goes with its code
		const { me, clearMe } = useGuest.getState()
		if (me && me.tableId === get().held?.tableId) clearMe()
		localStorage.remove(TABLE_CODE_STORAGE_KEY)
		set({ held: null })
	},
}))

/**
 * Admins edit while edit mode is on. Otherwise you need the table's code saved
 * on this device, or with codes switched off, to have claimed someone at the
 * table. Unclaimed devices can still join: claim a person or add themselves.
 */
export function useTableAccess(tableId: string) {
	const { isAdmin } = useIsAdmin()
	const held = useHeldTableCode(s => s.held)
	const release = useHeldTableCode(s => s.release)
	const { tableCodes } = useConfig()
	const claimedTableId = useGuest(s => s.me?.tableId)
	const code = held?.tableId === tableId ? held.code : null

	// a rerolled code should lock out devices still holding the old one
	const { data } = useQuery({
		queryKey: ['tableCodeCheck', tableId, code],
		queryFn: () => verifyTableCode(tableId, { code: code ?? '' }),
		enabled: Boolean(tableId && code) && !isAdmin && tableCodes,
		staleTime: Infinity,
	})

	useEffect(() => {
		if (data && !data.valid) release()
	}, [data, release])

	const open = !tableCodes && (!claimedTableId || claimedTableId === tableId)
	const canEdit = isAdmin || (tableCodes ? Boolean(code) : open)

	return {
		isAdmin,
		canEdit,
		canJoin: canEdit || (!tableCodes && !claimedTableId),
	}
}

export function useTableCodeUnlock(tableId: string, onUnlock?: () => void) {
	const [code, setCode] = useState('')
	const [invalid, setInvalid] = useState(false)
	const hold = useHeldTableCode(s => s.hold)
	const { pinLength } = useConfig()
	const { mutate, isPending } = useVerifyTableCode()

	const submit = (value: string) => {
		if (value.length < pinLength) return
		setInvalid(false)
		mutate(
			{ id: tableId, data: { code: value } },
			{
				onSuccess: res => {
					if (res.valid) {
						hold({ tableId, code: value })
						setCode('')
						onUnlock?.()
					} else {
						setInvalid(true)
						setCode('')
					}
				},
				onError: () => setInvalid(true),
			}
		)
	}

	const onChange = (value: string) => {
		setCode(value)
		if (invalid) setInvalid(false)
	}

	return { code, onChange, submit, invalid, isPending, pinLength }
}
