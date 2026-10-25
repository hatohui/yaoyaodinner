import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useDebounce } from '@/hooks/useDebounce'
import type { AppConfigDto } from '@/api/model'

interface ConfigRowProps {
	item: AppConfigDto
	onSave: (key: string, value: string) => void
}

export function ConfigRow({ item, onSave }: ConfigRowProps) {
	const { t } = useTranslation()

	const label = (
		<div className='flex min-w-0 flex-col'>
			<span className='truncate text-sm font-medium text-foreground'>
				{item.label ?? item.key}
			</span>
			<span className='truncate text-xs text-muted-foreground'>{item.key}</span>
		</div>
	)

	if (item.type === 'boolean') {
		return (
			<div className='flex items-center justify-between gap-3 py-3'>
				{label}
				<Switch
					checked={item.value === 'true'}
					onCheckedChange={c => onSave(item.key, c ? 'true' : 'false')}
				/>
			</div>
		)
	}

	return (
		<div className='flex flex-col gap-2 py-3'>
			{label}
			<TextEditor
				item={item}
				onSave={onSave}
				invalidLabel={t('admin.settings.invalid_json')}
			/>
		</div>
	)
}

function TextEditor({
	item,
	onSave,
	invalidLabel,
}: ConfigRowProps & { invalidLabel: string }) {
	const [draft, setDraft] = useState(item.value)
	const [error, setError] = useState(false)
	const [showSecret, setShowSecret] = useState(false)
	const debounced = useDebounce(draft, 600)
	const lastSaved = useRef(item.value)

	useEffect(() => {
		if (debounced === lastSaved.current) return
		if (item.type === 'json') {
			try {
				JSON.parse(debounced)
			} catch {
				setError(true)
				return
			}
		}
		setError(false)
		lastSaved.current = debounced
		onSave(item.key, debounced)
	}, [debounced, item.key, item.type, onSave])

	const isSecret = item.key.toLowerCase().includes('passphrase')

	if (item.type === 'json') {
		return (
			<>
				<Textarea
					value={draft}
					onChange={e => setDraft(e.target.value)}
					rows={2}
					className='font-mono text-xs'
				/>
				{error && (
					<span className='text-xs font-medium text-destructive'>
						{invalidLabel}
					</span>
				)}
			</>
		)
	}

	return (
		<div className='relative max-w-xs'>
			<Input
				value={draft}
				onChange={e => setDraft(e.target.value)}
				type={
					isSecret && !showSecret
						? 'password'
						: item.type === 'number'
							? 'number'
							: item.key === 'event.dinnerTime'
								? 'datetime-local'
								: 'text'
				}
				className={isSecret ? 'pr-9' : ''}
			/>
			{isSecret && (
				<button
					type='button'
					onClick={() => setShowSecret(prev => !prev)}
					className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
				>
					{showSecret ? (
						<EyeOff className='size-4' />
					) : (
						<Eye className='size-4' />
					)}
				</button>
			)}
		</div>
	)
}
