import type { TFunction } from 'i18next'
import { Allergen, type PersonAllergyDto, type PersonDto } from '@/api/model'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/shadcn'

const MAX_OTHER = 100
const CHOICES = Object.values(Allergen).filter(a => a !== Allergen.other)

export interface AllergyInput {
	allergen: Allergen
	label?: string
}

export function allergyDraftFromPerson(person: PersonDto | null): {
	picked: Set<Allergen>
	other: string
} {
	const current = person?.allergies ?? []
	return {
		picked: new Set(
			current.filter(a => a.allergen !== 'other').map(a => a.allergen)
		),
		other: current
			.filter(a => a.allergen === 'other')
			.map(a => a.label)
			.filter(Boolean)
			.join(', '),
	}
}

export function allergyInputsFromDraft(
	picked: Set<Allergen>,
	other: string
): AllergyInput[] {
	return [
		...[...picked].map(allergen => ({ allergen })),
		...other
			.split(',')
			.map(s => s.trim())
			.filter(Boolean)
			.map(label => ({ allergen: Allergen.other, label })),
	]
}

function normalizeAllergies(
	list: readonly { allergen: Allergen; label?: string | null }[]
): string[] {
	const keys = list.map(
		a =>
			`${a.allergen}:${a.allergen === Allergen.other ? (a.label?.trim().toLowerCase() ?? '') : ''}`
	)
	return [...new Set(keys)].sort()
}

export function sameAllergies(
	a: readonly { allergen: Allergen; label?: string | null }[],
	b: readonly { allergen: Allergen; label?: string | null }[]
): boolean {
	const na = normalizeAllergies(a)
	const nb = normalizeAllergies(b)
	return na.length === nb.length && na.every((k, i) => k === nb[i])
}

export function formatPersonAllergies(
	allergies: PersonAllergyDto[] | undefined,
	t: TFunction
): string {
	if (!allergies?.length) return ''
	return allergies
		.map(a =>
			a.allergen === Allergen.other && a.label
				? a.label
				: t(`plan_board.allergen.${a.allergen}`)
		)
		.join(', ')
}

interface AllergyPickerProps {
	picked: Set<Allergen>
	other: string
	onToggle: (allergen: Allergen) => void
	onOtherChange: (value: string) => void
	t: TFunction
}

export function AllergyPicker({
	picked,
	other,
	onToggle,
	onOtherChange,
	t,
}: AllergyPickerProps) {
	return (
		<div className='flex flex-col gap-3'>
			<div className='flex flex-wrap gap-2'>
				{CHOICES.map(allergen => (
					<button
						key={allergen}
						type='button'
						aria-pressed={picked.has(allergen)}
						onClick={() => onToggle(allergen)}
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
				onChange={e => onOtherChange(e.target.value)}
				className='rounded-xl'
			/>
		</div>
	)
}
