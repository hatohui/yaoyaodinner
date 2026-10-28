import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Crown, ImageOff, Trash2, UserCheck } from 'lucide-react'
import type { PersonDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { usePersonNote } from '@/hooks/usePersonNote'

interface PersonDialogProps {
	person: PersonDto | null
	canClaim: boolean
	canSetHost: boolean
	isHost: boolean
	onOpenChange: (open: boolean) => void
	onSave: (changes: {
		name?: string
		isHost?: boolean
		pfpUrl?: string | null
	}) => void
	onClaim: () => void
	onRemove: () => void
}

export function PersonDialog({
	person,
	canClaim,
	canSetHost,
	isHost,
	onOpenChange,
	onSave,
	onClaim,
	onRemove,
}: PersonDialogProps) {
	const { t } = useTranslation()
	const { note, save: saveNote } = usePersonNote(person?.id ?? '')
	const [name, setName] = useState('')
	const [noteDraft, setNoteDraft] = useState('')
	const [hostDraft, setHostDraft] = useState(false)
	const [pfpDraft, setPfpDraft] = useState<string | null>(null)
	const personId = person?.id

	useEffect(() => {
		if (!personId) return
		setName(person.name)
		setHostDraft(isHost)
		setPfpDraft(person.pfpUrl ?? null)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [personId])

	useEffect(() => {
		if (personId) setNoteDraft(note?.content ?? '')
	}, [personId, note?.content])

	if (!person) return null

	const trimmedName = name.trim()
	const nameChanged = Boolean(trimmedName) && trimmedName !== person.name
	const noteChanged = noteDraft.trim() !== (note?.content ?? '')
	const hostChanged = hostDraft !== isHost
	const pfpChanged = pfpDraft !== (person.pfpUrl ?? null)
	const dirty = nameChanged || noteChanged || hostChanged || pfpChanged

	const save = () => {
		if (!dirty) return
		onSave({
			name: nameChanged ? trimmedName : undefined,
			isHost: hostChanged ? hostDraft : undefined,
			pfpUrl: pfpChanged ? pfpDraft : undefined,
		})
		if (noteChanged) saveNote(noteDraft.trim())
		onOpenChange(false)
	}

	return (
		<Dialog open onOpenChange={onOpenChange}>
			<DialogContent className='gap-5 rounded-3xl sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{t('roster.edit_person', { name: person.name })}
					</DialogTitle>
				</DialogHeader>

				<div className='flex items-center gap-4'>
					<ImageUploadSlot
						shape='circle'
						folder='person-pfps'
						imageKey={pfpDraft}
						onChange={setPfpDraft}
						className='[&>button]:size-16'
					/>
					<div className='flex min-w-0 flex-1 flex-col gap-1.5'>
						<Label htmlFor='person-name'>{t('roster.name_label')}</Label>
						<Input
							id='person-name'
							value={name}
							onChange={e => setName(e.target.value)}
							onKeyDown={e => e.key === 'Enter' && save()}
							className='rounded-xl'
						/>
					</div>
				</div>
				{pfpDraft && (
					<button
						type='button'
						onClick={() => setPfpDraft(null)}
						className='-mt-3 inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive'
					>
						<ImageOff className='size-3.5' />
						{t('common.remove_image')}
					</button>
				)}

				<div className='flex flex-col gap-1.5'>
					<Label htmlFor='person-note'>{t('roster.note_label')}</Label>
					<Textarea
						id='person-note'
						value={noteDraft}
						onChange={e => setNoteDraft(e.target.value)}
						placeholder={t('notes.placeholder')}
						rows={3}
						className='rounded-xl'
					/>
				</div>

				{canSetHost && (
					<label className='flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-input bg-muted/40 px-4 py-3 text-sm transition-colors hover:bg-muted/60 dark:border-border/80 dark:bg-background/80 dark:hover:bg-background'>
						<span className='flex items-center gap-2'>
							<Crown className='size-4 text-primary' />
							{t('roster.host_label')}
						</span>
						<Switch checked={hostDraft} onCheckedChange={setHostDraft} />
					</label>
				)}

				{canClaim && (
					<Button
						variant='outline'
						className='gap-1.5 rounded-full border border-primary/50 bg-primary/15 font-semibold text-primary hover:bg-primary/25 hover:text-primary dark:border-primary/60 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30'
						onClick={onClaim}
					>
						<UserCheck className='size-4' />
						{t('roster.this_is_me')}
					</Button>
				)}

				<DialogFooter className='flex-row items-center justify-between gap-2 sm:justify-between'>
					<Button
						variant='ghost'
						className='gap-1.5 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive'
						onClick={onRemove}
					>
						<Trash2 className='size-4' />
						{t('roster.remove')}
					</Button>
					<Button
						className='rounded-full px-6'
						disabled={!dirty}
						onClick={save}
					>
						{t('common.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
