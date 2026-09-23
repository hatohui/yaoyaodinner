import { useTranslation } from 'react-i18next'
import type { PersonDto } from '@/api/model'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/utils/shadcn'

export type SplitMode = 'me' | 'table' | 'choose'

interface SplitModeSelectorProps {
	people: PersonDto[]
	mode: SplitMode
	onModeChange: (mode: SplitMode) => void
	chosen: Set<string>
	onToggle: (personId: string) => void
	myPersonId?: string | null
}

export function SplitModeSelector({
	people,
	mode,
	onModeChange,
	chosen,
	onToggle,
	myPersonId,
}: SplitModeSelectorProps) {
	const { t } = useTranslation()

	return (
		<div className='flex flex-col gap-3'>
			<RadioGroup
				value={mode}
				onValueChange={v => onModeChange(v as SplitMode)}
				className='gap-3'
			>
				<label className='flex items-center gap-2.5 text-sm font-medium text-foreground'>
					<RadioGroupItem value='me' disabled={!myPersonId} />
					{t('split.just_me')}
				</label>
				<label className='flex items-center gap-2.5 text-sm font-medium text-foreground'>
					<RadioGroupItem value='table' />
					{t('split.whole_table')}
				</label>
				<label className='flex items-center gap-2.5 text-sm font-medium text-foreground'>
					<RadioGroupItem value='choose' />
					{t('split.choose_people')}
				</label>
			</RadioGroup>

			{mode === 'choose' && (
				<div className='flex flex-wrap gap-2'>
					{people.map(person => (
						<button
							key={person.id}
							type='button'
							onClick={() => onToggle(person.id)}
							className={cn(
								'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
								chosen.has(person.id)
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border bg-control text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
							)}
						>
							{person.name}
						</button>
					))}
				</div>
			)}
		</div>
	)
}
