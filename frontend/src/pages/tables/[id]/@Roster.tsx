import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Crown, NotebookText, Pencil, UserCheck } from 'lucide-react'
import type { PersonDto, TableDto } from '@/api/model'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ImageViewer } from '@/components/common/ImageViewer'
import { StoredImage } from '@/components/common/StoredImage'
import { TruncatedText } from '@/components/common/TruncatedText'
import { cn } from '@/utils/shadcn'
import { useGuest } from '@/hooks/useGuest'
import { ViewToggle, useListView } from '@/components/common/ViewToggle'
import { ROSTER_VIEW_STORAGE_KEY } from '@/common/constants'
import { useRoster } from './@useRoster'
import { PersonDialog } from './@PersonDialog'

interface RosterProps {
	table: TableDto
	canEdit: boolean
	onSetHost: (personId: string | null) => void
}

export function Roster({ table, canEdit, onSetHost }: RosterProps) {
	const { t } = useTranslation()
	const { people, add, remove, updatePfp, rename } = useRoster(table.id)
	const me = useGuest(s => s.me)
	const setMe = useGuest(s => s.setMe)
	const clearMe = useGuest(s => s.clearMe)
	const [pending, setPending] = useState<PersonDto | null>(null)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [viewing, setViewing] = useState<PersonDto | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const { view, setView } = useListView(ROSTER_VIEW_STORAGE_KEY)
	const compact = view === 'compact'

	const mine = people.find(p => p.id === me?.id)
	const editingPerson = people.find(p => p.id === editingId) ?? null
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

	const claim = (person: PersonDto) =>
		setMe({
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
		<div className='flex flex-col gap-3 sm:gap-4'>
			<div className='flex items-center justify-between'>
				<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
					{t('roster.people_here')}
				</p>
				{people.length > 0 && <ViewToggle view={view} onChange={setView} />}
			</div>

			{canEdit && people.length > 0 && !me && (
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
				<ul
					className={cn(
						'flex flex-col',
						compact ? 'gap-1.5' : 'gap-2 sm:gap-3'
					)}
				>
					{people.map(person => (
						<RosterItem
							key={person.id}
							person={person}
							isMe={person.id === me?.id}
							isHost={person.id === table.tableLeaderId}
							showClaim={canEdit && !me}
							canEdit={canEdit}
							compact={compact}
							onClaim={() => claim(person)}
							onOpen={() => setEditingId(person.id)}
							onView={() => setViewing(person)}
						/>
					))}
				</ul>
			)}

			{canEdit && (
				<input
					ref={inputRef}
					onKeyDown={handleKeyDown}
					placeholder={t('roster.add_placeholder')}
					className='rounded-2xl border border-dashed border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary sm:px-5 sm:py-4'
				/>
			)}

			<PersonDialog
				person={editingPerson}
				canClaim={!me}
				isHost={editingPerson?.id === table.tableLeaderId}
				onOpenChange={open => !open && setEditingId(null)}
				onSave={changes => {
					if (!editingPerson) return
					if (changes.name) rename(editingPerson.id, changes.name)
					if (changes.isHost !== undefined)
						onSetHost(changes.isHost ? editingPerson.id : null)
					if (changes.pfpUrl !== undefined)
						updatePfp(editingPerson.id, changes.pfpUrl)
				}}
				onClaim={() => {
					if (editingPerson) claim(editingPerson)
					setEditingId(null)
				}}
				onRemove={() => {
					setPending(editingPerson)
					setEditingId(null)
				}}
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

			{viewing?.pfpUrl && (
				<ImageViewer
					imageKey={viewing.pfpUrl}
					alt={viewing.name}
					open
					onOpenChange={open => !open && setViewing(null)}
				/>
			)}
		</div>
	)
}

function RosterItem({
	person,
	isMe,
	isHost,
	showClaim,
	canEdit,
	compact,
	onClaim,
	onOpen,
	onView,
}: {
	person: PersonDto
	isMe: boolean
	isHost: boolean
	showClaim: boolean
	canEdit: boolean
	compact: boolean
	onClaim: () => void
	onOpen: () => void
	onView: () => void
}) {
	const { t } = useTranslation()
	const note = person.personalNotes?.[0]?.content
	const saved = !person.id.startsWith('temp-')
	const editable = canEdit && saved

	const avatar = (
		<StoredImage
			imageKey={person.pfpUrl}
			className='size-full object-cover'
			fallback={person.name.charAt(0).toUpperCase()}
		/>
	)
	const avatarClass = cn(
		'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground',
		compact ? 'size-8 text-xs' : 'size-11 text-sm sm:size-12'
	)

	return (
		<li
			className={cn(
				'relative flex items-center gap-3 border border-border bg-card shadow-sm transition-colors',
				compact
					? 'rounded-xl px-3 py-2'
					: 'min-h-[4.5rem] rounded-2xl px-4 py-3 sm:gap-4 sm:px-5 sm:py-4',
				editable && 'hover:border-primary/40 hover:bg-primary/5',
				isMe && 'border-primary ring-2 ring-primary/30'
			)}
		>
			{editable && (
				<button
					type='button'
					onClick={onOpen}
					aria-label={t('roster.edit_person', { name: person.name })}
					className='absolute inset-0 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring'
				/>
			)}

			{person.pfpUrl ? (
				<button
					type='button'
					onClick={onView}
					aria-label={t('common.view_image')}
					className={cn(
						avatarClass,
						'relative cursor-zoom-in ring-primary/40 transition-shadow hover:ring-2'
					)}
				>
					{avatar}
				</button>
			) : (
				<span className={cn(avatarClass, 'pointer-events-none relative')}>
					{avatar}
				</span>
			)}

			<div
				className={cn(
					'pointer-events-none relative flex min-w-0 flex-1',
					compact ? 'items-center gap-2' : 'flex-col gap-0.5'
				)}
			>
				<span
					className={cn(
						'flex min-w-0 items-center gap-1.5 font-medium text-foreground',
						compact ? 'shrink-0 text-sm' : 'sm:text-base'
					)}
				>
					<TruncatedText
						text={person.name}
						onClick={editable ? onOpen : undefined}
						className='pointer-events-auto'
					/>
					{isMe && (
						<span className='shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/30'>
							{t('roster.you')}
						</span>
					)}
					{isHost && (
						<span
							title={t('roster.host')}
							aria-label={t('roster.host')}
							className='flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'
						>
							<Crown className='size-3' />
						</span>
					)}
				</span>
				{note && (
					<span
						className={cn(
							'flex min-w-0 items-center gap-1.5 text-muted-foreground',
							compact ? 'text-xs' : 'text-sm'
						)}
					>
						<NotebookText className='size-3.5 shrink-0 text-primary' />
						<TruncatedText
							text={note}
							onClick={editable ? onOpen : undefined}
							className='pointer-events-auto'
						/>
					</span>
				)}
			</div>

			{saved && showClaim && (
				<button
					type='button'
					onClick={onClaim}
					className={cn(
						'relative inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-control font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
						compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
					)}
				>
					{!compact && <UserCheck className='size-3.5' />}
					{t('roster.this_is_me')}
				</button>
			)}
			{editable && (
				<Pencil className='pointer-events-none relative size-4 shrink-0 text-muted-foreground' />
			)}
		</li>
	)
}
