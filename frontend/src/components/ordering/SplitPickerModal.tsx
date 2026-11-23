import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PersonDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
	SplitModeSelector,
	type SplitMode,
} from '@/components/common/SplitModeSelector'

interface SplitPickerModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	people: PersonDto[]
	initialPersonIds: string[]
	initialSplitAll: boolean
	myPersonId?: string | null
	onConfirm: (splitAll: boolean, personIds: string[]) => void
}

export function SplitPickerModal({
	open,
	onOpenChange,
	people,
	initialPersonIds,
	initialSplitAll,
	myPersonId,
	onConfirm,
}: SplitPickerModalProps) {
	const { t } = useTranslation()
	const [mode, setMode] = useState<SplitMode>('table')
	const [chosen, setChosen] = useState<Set<string>>(new Set())

	useEffect(() => {
		if (!open) return
		if (initialSplitAll) {
			setMode('table')
			setChosen(new Set())
		} else if (
			myPersonId &&
			initialPersonIds.length === 1 &&
			initialPersonIds[0] === myPersonId
		) {
			setMode('me')
			setChosen(new Set(initialPersonIds))
		} else {
			setMode('choose')
			setChosen(new Set(initialPersonIds))
		}
	}, [open, initialSplitAll, initialPersonIds, myPersonId])

	const toggle = (id: string) => {
		setChosen(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const confirm = () => {
		if (mode === 'table') return onConfirm(true, [])
		if (mode === 'me' && myPersonId) return onConfirm(false, [myPersonId])
		onConfirm(false, [...chosen])
	}

	const canConfirm = mode !== 'choose' || chosen.size > 0

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='rounded-3xl'>
				<DialogHeader>
					<DialogTitle>{t('split.title')}</DialogTitle>
				</DialogHeader>

				<SplitModeSelector
					people={people}
					mode={mode}
					onModeChange={setMode}
					chosen={chosen}
					onToggle={toggle}
					myPersonId={myPersonId}
				/>

				<DialogFooter>
					<Button
						className='rounded-full'
						disabled={!canConfirm}
						onClick={confirm}
					>
						{t('common.confirm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
