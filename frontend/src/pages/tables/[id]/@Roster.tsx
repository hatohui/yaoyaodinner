import { useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { X, NotebookText, Crown } from 'lucide-react'
import type { PersonDto, TableDto } from '@/api/model'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { cn } from '@/utils/shadcn'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { useRoster } from './@useRoster'
import { PersonNoteDialog } from './@PersonNoteDialog'

interface RosterProps {
	table: TableDto
	onSetHost: (personId: string | null) => void
}

export function Roster({ table, onSetHost }: RosterProps) {
	const { t } = useTranslation()
	const { people, add, remove, updatePfp } = useRoster(table.id)
	const { personId: myPersonId } = useWhoAmI(table.id)
	const [pending, setPending] = useState<PersonDto | null>(null)
	const [noteFor, setNoteFor] = useState<PersonDto | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== 'Enter') return
		const input = e.currentTarget
		add(input.value)
		input.value = ''
		inputRef.current?.focus()
	}

	return (
		<div className='flex flex-col gap-3'>
			<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
				{t('roster.people_here')}
			</p>

			{people.length === 0 ? (
				<p className='py-6 text-center text-sm text-muted-foreground'>
					{t('roster.empty')}
				</p>
			) : (
				<ul className='flex flex-col gap-2'>
					{people.map(person => (
						<RosterItem
							key={person.id}
							person={person}
							table={table}
							onSetHost={onSetHost}
							onNote={() => setNoteFor(person)}
							onRemove={() => setPending(person)}
							onPfpChange={pfpUrl => updatePfp(person.id, pfpUrl)}
						/>
					))}
				</ul>
			)}

			<input
				ref={inputRef}
				onKeyDown={handleKeyDown}
				placeholder={t('roster.add_placeholder')}
				className='rounded-2xl border border-dashed border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'
			/>

			<ConfirmDialog
				open={pending !== null}
				onOpenChange={open => !open && setPending(null)}
				title={t('roster.remove_title', {
					name: pending?.name,
					table: table.name,
				})}
				description={t('roster.remove_desc')}
				confirmLabel={t('roster.remove')}
				onConfirm={() => {
					if (pending) remove(pending.id)
					setPending(null)
				}}
			/>

			<PersonNoteDialog
				person={noteFor}
				onOpenChange={open => !open && setNoteFor(null)}
			/>
		</div>
	)
}

function RosterItem({
	person,
	table,
	onSetHost,
	onNote,
	onRemove,
	onPfpChange,
}: {
	person: PersonDto
	table: TableDto
	onSetHost: (id: string | null) => void
	onNote: () => void
	onRemove: () => void
	onPfpChange: (pfpUrl: string | null) => void
}) {
	const { t } = useTranslation()
	const note = person.personalNotes?.[0]

	return (
		<li className='flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<ImageUploadSlot
						shape='circle'
						folder='person-pfps'
						imageKey={person.pfpUrl}
						onChange={onPfpChange}
					/>
					<span className='font-medium text-foreground'>
						{person.name}
						{person.id === table.tableLeaderId && (
							<span className='ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground'>
								{t('roster.host')}
							</span>
						)}
					</span>
				</div>
				<div className='flex items-center gap-1'>
					<button
						type='button'
						onClick={() =>
							onSetHost(person.id === table.tableLeaderId ? null : person.id)
						}
						className={cn(
							'rounded-full p-1 transition-colors',
							person.id === table.tableLeaderId
								? 'text-primary hover:bg-accent'
								: 'text-muted-foreground hover:bg-muted hover:text-foreground'
						)}
					>
						<Crown className='size-4' />
					</button>
					<button
						type='button'
						onClick={onNote}
						className='rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<NotebookText className='size-4' />
					</button>
					<button
						type='button'
						onClick={onRemove}
						className='rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
					>
						<X className='size-4' />
					</button>
				</div>
			</div>
			
			{note?.content && (
				<div className='rounded-xl bg-accent/5 px-3 py-2 text-sm italic text-muted-foreground'>
					{note.content}
				</div>
			)}
		</li>
	)
}
