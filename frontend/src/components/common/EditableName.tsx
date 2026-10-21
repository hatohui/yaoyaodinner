import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/shadcn'

interface EditableNameProps {
	value: string
	onSave: (name: string) => void
	className?: string
	inputClassName?: string
	buttonClassName?: string
}

export function EditableName({
	value,
	onSave,
	className,
	inputClassName,
	buttonClassName,
}: EditableNameProps) {
	const { t } = useTranslation()
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(value)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!editing) setDraft(value)
	}, [value, editing])

	useEffect(() => {
		if (editing) inputRef.current?.select()
	}, [editing])

	const commit = () => {
		const next = draft.trim()
		if (next && next !== value) onSave(next)
		else setDraft(value)
		setEditing(false)
	}

	if (editing) {
		return (
			<Input
				ref={inputRef}
				value={draft}
				autoFocus
				onChange={e => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={e => {
					if (e.key === 'Enter') commit()
					if (e.key === 'Escape') {
						setDraft(value)
						setEditing(false)
					}
				}}
				className={cn('h-auto rounded-xl px-2 py-1', className, inputClassName)}
			/>
		)
	}

	return (
		<span className='inline-flex min-w-0 items-center gap-1.5'>
			<span title={value} className={cn('truncate', className)}>
				{value}
			</span>
			<button
				type='button'
				onClick={() => setEditing(true)}
				title={t('common.rename')}
				aria-label={t('common.rename')}
				className={cn(
					'flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
					buttonClassName
				)}
			>
				<Pencil className='size-3.5' />
			</button>
		</span>
	)
}
