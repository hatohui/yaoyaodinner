import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Allergen, type PersonDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/shadcn'

const MAX_OTHER = 100
const CHOICES = Object.values(Allergen).filter(a => a !== Allergen.other)

interface AllergyDialogProps {
	person: PersonDto | null
	isSaving: boolean
	onOpenChange: (open: boolean) => void
	onSave: (allergies: { allergen: Allergen; label?: string }[]) => void
}

export function AllergyDialog({
	person,
	isSaving,
	onOpenChange,
	onSave,
}: AllergyDialogProps) {
	const { t } = useTranslation()
	const [picked, setPicked] = useState<Set<Allergen>>(new Set())
	const [other, setOther] = useState('')

	useEffect(() => {
		if (!person) return
		const current = person.allergies ?? []
		setPicked(
			new Set(current.filter(a => a.allergen !== 'other').map(a => a.allergen))
		)
		setOther(
			current
				.filter(a => a.allergen === 'other')
				.map(a => a.label)
				.filter(Boolean)
				.join(', ')
		)
	}, [person])

	const toggle = (allergen: Allergen) =>
		setPicked(prev => {
			const next = new Set(prev)
			if (next.has(allergen)) next.delete(allergen)
			else next.add(allergen)
			return next
		})

	const save = () =>
		onSave([
			...[...picked].map(allergen => ({ allergen })),
			...other
				.split(',')
				.map(s => s.trim())
				.filter(Boolean)
				.map(label => ({ allergen: Allergen.other, label })),
		])

	return (
		<Dialog open={person !== null} onOpenChange={onOpenChange}>
			<DialogContent className='gap-5 rounded-3xl sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{t('plan_board.allergies_for', { name: person?.name ?? '' })}
					</DialogTitle>
				</DialogHeader>

				<div className='flex flex-wrap gap-2'>
					{CHOICES.map(allergen => (
						<button
							key={allergen}
							type='button'
							aria-pressed={picked.has(allergen)}
							onClick={() => toggle(allergen)}
							className={cn(
								'cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors',
								picked.has(allergen)
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/10'
							)}
						>
							{t(`plan_board.allergen.${allergen}`)}
						</button>
					))}
				</div>

				<Input
					value={other}
					maxLength={MAX_OTHER}
					placeholder={t('plan_board.other_placeholder')}
					onChange={e => setOther(e.target.value)}
					className='rounded-xl'
				/>

				<DialogFooter>
					<Button
						className='rounded-full px-6'
						disabled={isSaving}
						onClick={save}
					>
						{t('common.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
