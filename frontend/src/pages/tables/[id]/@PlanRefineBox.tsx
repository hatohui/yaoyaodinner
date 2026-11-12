import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MAX_NOTE = 300

interface PlanRefineBoxProps {
	disabled: boolean
	onRefine: (note: string) => void
}

export function PlanRefineBox({ disabled, onRefine }: PlanRefineBoxProps) {
	const { t } = useTranslation()
	const [note, setNote] = useState('')
	const trimmed = note.trim()

	return (
		<form
			className='flex flex-col gap-1.5'
			onSubmit={e => {
				e.preventDefault()
				if (!trimmed || disabled) return
				onRefine(trimmed)
				setNote('')
			}}
		>
			<div className='flex items-baseline justify-between gap-2'>
				<label
					htmlFor='plan-refine'
					className='text-xs font-semibold text-foreground'
				>
					{t('table_plan.refine_label')}
				</label>
				<span className='text-xs tabular-nums text-muted-foreground'>
					{t('table_plan.char_count', { count: note.length, max: MAX_NOTE })}
				</span>
			</div>
			<div className='flex gap-2'>
				<Input
					id='plan-refine'
					value={note}
					maxLength={MAX_NOTE}
					onChange={e => setNote(e.target.value)}
					placeholder={t('table_plan.refine_placeholder')}
					className='rounded-full'
				/>
				<Button
					type='submit'
					disabled={!trimmed || disabled}
					className='h-9 shrink-0 gap-1.5 rounded-full bg-banner-icon text-banner-icon-foreground shadow-sm hover:brightness-110 disabled:opacity-40'
				>
					<Wand2 className='size-4' />
					{t('table_plan.refine')}
				</Button>
			</div>
		</form>
	)
}
