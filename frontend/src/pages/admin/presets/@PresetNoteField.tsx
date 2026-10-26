import { useTranslation } from 'react-i18next'
import { Gift, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DebouncedInput } from '@/components/common/DebouncedInput'
import { IncludedNoteStrip } from '@/components/common/IncludedNoteStrip'

interface PresetNoteFieldProps {
	note: string | null
	onCommit: (note: string) => void
}

export function PresetNoteField({ note, onCommit }: PresetNoteFieldProps) {
	const { t } = useTranslation()

	return (
		<div className='flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3'>
			<div className='flex items-start gap-2'>
				<Gift className='mt-0.5 size-4 shrink-0 text-primary' />
				<div className='flex flex-1 flex-col gap-0.5'>
					<span className='text-sm font-medium text-foreground'>
						{t('admin.presets.note_label')}
					</span>
					<span className='text-xs text-muted-foreground'>
						{t('admin.presets.note_hint')}
					</span>
				</div>
				{note && (
					<Button
						size='sm'
						variant='ghost'
						className='-my-1 gap-1.5 rounded-full text-muted-foreground hover:text-destructive'
						onClick={() => onCommit('')}
					>
						<Trash2 className='size-4' />
						{t('admin.presets.note_remove')}
					</Button>
				)}
			</div>

			<DebouncedInput
				value={note ?? ''}
				onCommit={value => {
					if (value.trim() !== (note ?? '')) onCommit(value)
				}}
				placeholder={t('admin.presets.note_placeholder')}
				className='h-9 rounded-full'
			/>

			{note && <IncludedNoteStrip note={note} />}
		</div>
	)
}
