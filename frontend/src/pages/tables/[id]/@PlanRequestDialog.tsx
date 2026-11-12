import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import type { PlanRequest } from './@useTablePlan'

const MAX_HEADCOUNT = 40
const MAX_PREFERENCE = 300

export type PlanDefaults = {
	headcount: number
	budgetPerPerson: number | null
	preference: string | null
	alcohol: boolean
}

interface PlanRequestDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	defaults: PlanDefaults
	onSubmit: (request: PlanRequest) => void
}

export function PlanRequestDialog({
	open,
	onOpenChange,
	defaults,
	onSubmit,
}: PlanRequestDialogProps) {
	const { t } = useTranslation()
	const [headcount, setHeadcount] = useState('')
	const [budget, setBudget] = useState('')
	const [preference, setPreference] = useState('')
	const [alcohol, setAlcohol] = useState(true)

	useEffect(() => {
		if (!open) return
		setHeadcount(String(defaults.headcount))
		setBudget(defaults.budgetPerPerson ? String(defaults.budgetPerPerson) : '')
		setPreference(defaults.preference ?? '')
		setAlcohol(defaults.alcohol)
	}, [open, defaults])

	const people = Number(headcount)
	const perPerson = Number(budget)
	const validPeople =
		Number.isInteger(people) && people >= 1 && people <= MAX_HEADCOUNT
	const validBudget =
		budget.trim() === '' || (Number.isFinite(perPerson) && perPerson >= 1)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-sm'>
				<DialogHeader>
					<DialogTitle>{t('table_plan.dialog_title')}</DialogTitle>
					<DialogDescription>{t('table_plan.dialog_body')}</DialogDescription>
				</DialogHeader>
				<form
					className='flex flex-col gap-4'
					onSubmit={e => {
						e.preventDefault()
						if (!validPeople || !validBudget) return
						onSubmit({
							headcount: people,
							budgetPerPerson: budget.trim() === '' ? undefined : perPerson,
							preference: preference.trim() || undefined,
							alcohol,
						})
					}}
				>
					<label className='flex flex-col gap-1.5 text-sm'>
						<span className='font-medium text-foreground'>
							{t('table_plan.headcount')}
						</span>
						<Input
							type='number'
							inputMode='numeric'
							min={1}
							max={MAX_HEADCOUNT}
							value={headcount}
							onChange={e => setHeadcount(e.target.value)}
						/>
					</label>
					<label className='flex flex-col gap-1.5 text-sm'>
						<span className='font-medium text-foreground'>
							{t('table_plan.budget')}
						</span>
						<Input
							type='number'
							inputMode='decimal'
							min={1}
							step='1'
							placeholder={t('table_plan.budget_placeholder')}
							value={budget}
							onChange={e => setBudget(e.target.value)}
						/>
						<span className='text-xs text-muted-foreground'>
							{t('table_plan.budget_hint')}
						</span>
					</label>
					<label className='flex flex-col gap-1.5 text-sm'>
						<span className='font-medium text-foreground'>
							{t('table_plan.preference')}
						</span>
						<Textarea
							rows={2}
							maxLength={MAX_PREFERENCE}
							placeholder={t('table_plan.preference_placeholder')}
							value={preference}
							onChange={e => setPreference(e.target.value)}
						/>
						<span className='self-end text-xs tabular-nums text-muted-foreground'>
							{t('table_plan.char_count', {
								count: preference.length,
								max: MAX_PREFERENCE,
							})}
						</span>
					</label>
					<label className='flex cursor-pointer items-center justify-between gap-3 text-sm'>
						<span className='flex flex-col'>
							<span className='font-medium text-foreground'>
								{t('table_plan.alcohol')}
							</span>
							<span className='text-xs text-muted-foreground'>
								{t('table_plan.alcohol_hint')}
							</span>
						</span>
						<Switch checked={alcohol} onCheckedChange={setAlcohol} />
					</label>
					<DialogFooter>
						<Button
							type='submit'
							disabled={!validPeople || !validBudget}
							className='gap-1.5 rounded-full'
						>
							<Sparkles className='size-4' />
							{t('table_plan.submit')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
