import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Allergen, PersonDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
	AllergyPicker,
	allergyDraftFromPerson,
	allergyInputsFromDraft,
	type AllergyInput,
} from './@AllergyPicker'

interface AllergyDialogProps {
	person: PersonDto | null
	isSaving: boolean
	onOpenChange: (open: boolean) => void
	onSave: (allergies: AllergyInput[]) => void
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
		const draft = allergyDraftFromPerson(person)
		setPicked(draft.picked)
		setOther(draft.other)
	}, [person])

	const toggle = (allergen: Allergen) =>
		setPicked(prev => {
			const next = new Set(prev)
			if (next.has(allergen)) next.delete(allergen)
			else next.add(allergen)
			return next
		})

	const save = () => onSave(allergyInputsFromDraft(picked, other))

	return (
		<Dialog open={person !== null} onOpenChange={onOpenChange}>
			<DialogContent className='gap-5 rounded-3xl sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{t('plan_board.allergies_for', { name: person?.name ?? '' })}
					</DialogTitle>
				</DialogHeader>

				<AllergyPicker
					picked={picked}
					other={other}
					onToggle={toggle}
					onOtherChange={setOther}
					t={t}
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
