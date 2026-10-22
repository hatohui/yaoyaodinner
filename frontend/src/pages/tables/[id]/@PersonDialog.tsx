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
	isMe: boolean
	isHost: boolean
	onOpenChange: (open: boolean) => void
	onPfpChange: (pfpUrl: string | null) => void
	onSave: (changes: { name?: string; isMe?: boolean; isHost?: boolean }) => void
	onRemove: () => void
}

export function PersonDialog({
	person,
	isMe,
	isHost,
	onOpenChange,
	onPfpChange,
	onSave,
	onRemove,
}: PersonDialogProps) {
	const { t } = useTranslation()
	const { note, save: saveNote } = usePersonNote(person?.id ?? '')
	const [name, setName] = useState('')
	const [noteDraft, setNoteDraft] = useState('')
	const [meDraft, setMeDraft] = useState(false)
	const [hostDraft, setHostDraft] = useState(false)
	const personId = person?.id

	useEffect(() => {
		if (!personId) return
		setName(person.name)
		setMeDraft(isMe)
		setHostDraft(isHost)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [personId])

	useEffect(() => {
		if (personId) setNoteDraft(note?.content ?? '')
	}, [personId, note?.content])

	if (!person) return null

	const save = () => {
		const trimmed = name.trim()
		onSave({
			name: trimmed && trimmed !== person.name ? trimmed : undefined,
			isMe: meDraft !== isMe ? meDraft : undefined,
			isHost: hostDraft !== isHost ? hostDraft : undefined,
		})
		if (noteDraft.trim() !== (note?.content ?? '')) saveNote(noteDraft.trim())
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
						imageKey={person.pfpUrl}
						onChange={onPfpChange}
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
				{person.pfpUrl && (
					<button
						type='button'
						onClick={() => onPfpChange(null)}
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

				<div className='flex flex-col divide-y divide-border rounded-2xl border border-border'>
					<label className='flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm'>
						<span className='flex items-center gap-2'>
							<UserCheck className='size-4 text-primary' />
							{t('roster.this_is_me')}
						</span>
						<Switch checked={meDraft} onCheckedChange={setMeDraft} />
					</label>
					<label className='flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm'>
						<span className='flex items-center gap-2'>
							<Crown className='size-4 text-primary' />
							{t('roster.host_label')}
						</span>
						<Switch checked={hostDraft} onCheckedChange={setHostDraft} />
					</label>
				</div>

				<DialogFooter className='flex-row items-center justify-between gap-2 sm:justify-between'>
					<Button
						variant='ghost'
						className='gap-1.5 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive'
						onClick={onRemove}
					>
						<Trash2 className='size-4' />
						{t('roster.remove')}
					</Button>
					<Button className='rounded-full px-6' onClick={save}>
						{t('common.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
