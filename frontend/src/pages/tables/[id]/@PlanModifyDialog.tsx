import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

const MAX_NOTE = 300

interface PlanModifyDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (note: string) => void
}

export function PlanModifyDialog({
	open,
	onOpenChange,
	onSubmit,
}: PlanModifyDialogProps) {
	const { t } = useTranslation()
	const [note, setNote] = useState('')
	const trimmed = note.trim()

	useEffect(() => {
		if (open) setNote('')
	}, [open])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-sm' aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>{t('table_plan.modify_dialog_title')}</DialogTitle>
				</DialogHeader>
				<form
					className='flex flex-col gap-4'
					onSubmit={e => {
						e.preventDefault()
						if (trimmed) onSubmit(trimmed)
					}}
				>
					<label className='flex flex-col gap-1.5 text-sm'>
						<span className='font-medium text-foreground'>
							{t('table_plan.modify_label')}
						</span>
						<Textarea
							rows={3}
							maxLength={MAX_NOTE}
							placeholder={t('table_plan.modify_placeholder')}
							value={note}
							onChange={e => setNote(e.target.value)}
						/>
						<span className='self-end text-xs tabular-nums text-muted-foreground'>
							{t('table_plan.char_count', {
								count: note.length,
								max: MAX_NOTE,
							})}
						</span>
					</label>
					<DialogFooter>
						<Button
							type='submit'
							disabled={!trimmed}
							className='gap-1.5 rounded-full'
						>
							<Wand2 className='size-4' />
							{t('table_plan.modify_submit')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
