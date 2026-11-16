import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import type { PersonDto } from '@/api/model'
import { cn } from '@/utils/shadcn'
import type { AllergyGroup } from './@planBoard'

interface AllergySectionProps {
	groups: AllergyGroup[]
	people: PersonDto[]
	canEdit: boolean
	labelOf: (group: Pick<AllergyGroup, 'allergen' | 'label'>) => string
	onEditPerson: (person: PersonDto) => void
}

export function AllergySection({
	groups,
	people,
	canEdit,
	labelOf,
	onEditPerson,
}: AllergySectionProps) {
	const { t } = useTranslation()

	return (
		<section className='flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4'>
			<header className='flex items-center gap-2'>
				<ShieldAlert className='size-4 shrink-0 text-destructive' />
				<h2 className='text-sm font-semibold text-foreground'>
					{t('plan_board.allergies')}
				</h2>
			</header>

			{groups.length === 0 ? (
				<p className='text-xs text-muted-foreground'>
					{t('plan_board.allergies_empty')}
				</p>
			) : (
				<ul className='flex flex-col gap-1.5'>
					{groups.map(group => (
						<li key={group.key} className='text-sm text-foreground'>
							<span className='font-semibold text-destructive'>
								{labelOf(group)}
							</span>
							<span className='text-muted-foreground'> - </span>
							{group.people.join(', ')}
						</li>
					))}
				</ul>
			)}

			{canEdit && people.length > 0 && (
				<div className='flex flex-col gap-1.5 border-t border-border/60 pt-2.5'>
					<span className='text-xs text-muted-foreground'>
						{t('plan_board.edit_allergies')}
					</span>
					<div className='flex flex-wrap gap-1.5'>
						{people.map(person => {
							const count = person.allergies?.length ?? 0
							return (
								<button
									key={person.id}
									type='button'
									onClick={() => onEditPerson(person)}
									className={cn(
										'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-primary/40 hover:bg-primary/10',
										count > 0
											? 'border-destructive/40 bg-destructive/10 text-foreground'
											: 'border-border bg-card text-muted-foreground'
									)}
								>
									{person.name}
									{count > 0 && (
										<span className='font-semibold tabular-nums text-destructive'>
											{count}
										</span>
									)}
								</button>
							)
						})}
					</div>
				</div>
			)}
		</section>
	)
}
