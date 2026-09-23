import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { X, NotebookText, Crown, UserCheck } from 'lucide-react'
import type { PersonDto, TableDto } from '@/api/model'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { EditableName } from '@/components/common/EditableName'
import { StoredImage } from '@/components/common/StoredImage'
import { cn } from '@/utils/shadcn'
import { useGuest } from '@/hooks/useGuest'
import { ViewToggle, useListView } from '@/components/common/ViewToggle'
import { ROSTER_VIEW_STORAGE_KEY } from '@/common/constants'
import { useRoster } from './@useRoster'
import { PersonNoteDialog } from './@PersonNoteDialog'

interface RosterProps {
	table: TableDto
	editing: boolean
	onSetHost: (personId: string | null) => void
}

export function Roster({ table, editing, onSetHost }: RosterProps) {
	const { t } = useTranslation()
	const { people, add, remove, updatePfp, rename } = useRoster(table.id)
	const me = useGuest(s => s.me)
	const setMe = useGuest(s => s.setMe)
	const clearMe = useGuest(s => s.clearMe)
	const [pending, setPending] = useState<PersonDto | null>(null)
	const [noteFor, setNoteFor] = useState<PersonDto | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const { view, setView } = useListView(ROSTER_VIEW_STORAGE_KEY)
	const compact = view === 'compact'

	const mine = people.find(p => p.id === me?.id)
	useEffect(() => {
		if (
			mine &&
			(mine.name !== me?.name ||
				(mine.pfpUrl ?? null) !== me?.pfpUrl ||
				table.id !== me?.tableId)
		) {
			setMe({
				id: mine.id,
				name: mine.name,
				tableId: table.id,
				pfpUrl: mine.pfpUrl ?? null,
			})
		}
	}, [mine, me, table.id, setMe])

	const toggleMe = (person: PersonDto) =>
		person.id === me?.id
			? clearMe()
			: setMe({
					id: person.id,
					name: person.name,
					tableId: table.id,
					pfpUrl: person.pfpUrl ?? null,
				})

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== 'Enter') return
		const input = e.currentTarget
		add(input.value)
		input.value = ''
		inputRef.current?.focus()
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center justify-between'>
				<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
					{t('roster.people_here')}
				</p>
				{people.length > 0 && <ViewToggle view={view} onChange={setView} />}
			</div>

			{people.length > 0 && !me && (
				<p className='flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground'>
					<UserCheck className='mt-0.5 size-4 shrink-0 text-primary' />
					{t('roster.pick_yourself')}
				</p>
			)}

			{people.length === 0 ? (
				<p className='py-6 text-center text-sm text-muted-foreground'>
					{t('roster.empty')}
				</p>
			) : (
				<ul className={cn('flex flex-col', compact ? 'gap-1.5' : 'gap-2')}>
					{people.map(person => (
						<RosterItem
							key={person.id}
							person={person}
							table={table}
							isMe={person.id === me?.id}
							editing={editing}
							compact={compact}
							onToggleMe={() => toggleMe(person)}
							onSetHost={onSetHost}
							onNote={() => setNoteFor(person)}
							onRemove={() => setPending(person)}
							onPfpChange={pfpUrl => updatePfp(person.id, pfpUrl)}
							onRename={name => rename(person.id, name)}
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
					if (pending) {
						remove(pending.id)
						if (pending.id === me?.id) clearMe()
					}
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
	isMe,
	editing,
	compact,
	onToggleMe,
	onSetHost,
	onNote,
	onRemove,
	onPfpChange,
	onRename,
}: {
	person: PersonDto
	table: TableDto
	isMe: boolean
	editing: boolean
	compact: boolean
	onToggleMe: () => void
	onSetHost: (id: string | null) => void
	onNote: () => void
	onRemove: () => void
	onPfpChange: (pfpUrl: string | null) => void
	onRename: (name: string) => void
}) {
	const { t } = useTranslation()
	const note = person.personalNotes?.[0]

	return (
		<li
			className={cn(
				'flex flex-col gap-3 border border-border bg-card shadow-sm',
				compact ? 'rounded-xl px-3 py-2' : 'rounded-2xl px-4 py-3',
				isMe && 'border-primary ring-2 ring-primary/30'
			)}
		>
			<div className='flex items-center justify-between gap-2'>
				<div className='flex min-w-0 items-center gap-2'>
					{editing ? (
						<ImageUploadSlot
							shape='circle'
							folder='person-pfps'
							imageKey={person.pfpUrl}
							onChange={onPfpChange}
						/>
					) : (
						<span
							className={cn(
								'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground',
								compact ? 'size-7 text-xs' : 'size-10 text-sm'
							)}
						>
							<StoredImage
								imageKey={person.pfpUrl}
								className='size-full object-cover'
								fallback={person.name.charAt(0).toUpperCase()}
							/>
						</span>
					)}
					<span
						className={cn(
							'flex min-w-0 items-center gap-1.5 font-medium text-foreground',
							compact ? 'shrink-0 text-sm' : 'flex-wrap'
						)}
					>
						{editing ? (
							<EditableName value={person.name} onSave={onRename} />
						) : (
							<span className='truncate'>{person.name}</span>
						)}
						{isMe && (
							<span className='rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/30'>
								{t('roster.you')}
							</span>
						)}
						{person.id === table.tableLeaderId && (
							<span className='rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground'>
								{t('roster.host')}
							</span>
						)}
					</span>
					{compact && note?.content && (
						<span
							title={note.content}
							className='flex min-w-0 items-center gap-1 text-xs text-muted-foreground'
						>
							<NotebookText className='size-3 shrink-0 text-primary' />
							<span className='truncate'>{note.content}</span>
						</span>
					)}
				</div>
				<div className='flex shrink-0 items-center gap-1'>
					{!person.id.startsWith('temp-') && (
						<button
							type='button'
							onClick={onToggleMe}
							aria-pressed={isMe}
							className={cn(
								'mr-1 inline-flex items-center gap-1 rounded-full font-medium transition-colors',
								compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
								isMe
									? 'border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
									: 'border border-border bg-control text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
							)}
						>
							{!isMe && !compact && <UserCheck className='size-3.5' />}
							{t(isMe ? 'roster.not_me' : 'roster.this_is_me')}
						</button>
					)}
					{editing && (
						<>
							<button
								type='button'
								onClick={() =>
									onSetHost(
										person.id === table.tableLeaderId ? null : person.id
									)
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
						</>
					)}
				</div>
			</div>

			{!compact && note?.content && (
				<div className='flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm text-foreground/85'>
					<NotebookText className='mt-0.5 size-3.5 shrink-0 text-primary' />
					{note.content}
				</div>
			)}
		</li>
	)
}
