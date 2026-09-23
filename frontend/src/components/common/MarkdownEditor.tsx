import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Bold, Italic, Link, List } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/shadcn'

interface MarkdownEditorProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	rows?: number
	className?: string
}

type Wrap = { before: string; after: string; placeholder: string }

export function MarkdownEditor({
	value,
	onChange,
	placeholder,
	rows = 3,
	className,
}: MarkdownEditorProps) {
	const { t } = useTranslation()
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const applyWrap = ({ before, after, placeholder: ph }: Wrap) => {
		const el = textareaRef.current
		if (!el) return
		const start = el.selectionStart
		const end = el.selectionEnd
		const selected = value.slice(start, end) || ph
		const next =
			value.slice(0, start) + before + selected + after + value.slice(end)
		onChange(next)

		requestAnimationFrame(() => {
			el.focus()
			const cursor = start + before.length
			el.setSelectionRange(cursor, cursor + selected.length)
		})
	}

	const applyLinePrefix = (prefix: string) => {
		const el = textareaRef.current
		if (!el) return
		const start = el.selectionStart
		const lineStart = value.lastIndexOf('\n', start - 1) + 1
		const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
		onChange(next)

		requestAnimationFrame(() => {
			el.focus()
			const cursor = start + prefix.length
			el.setSelectionRange(cursor, cursor)
		})
	}

	const tools: {
		icon: typeof Bold
		label: string
		onClick: () => void
	}[] = [
		{
			icon: Bold,
			label: t('common.markdown_bold'),
			onClick: () =>
				applyWrap({ before: '**', after: '**', placeholder: t('common.markdown_bold') }),
		},
		{
			icon: Italic,
			label: t('common.markdown_italic'),
			onClick: () =>
				applyWrap({ before: '_', after: '_', placeholder: t('common.markdown_italic') }),
		},
		{
			icon: List,
			label: t('common.markdown_list'),
			onClick: () => applyLinePrefix('- '),
		},
		{
			icon: Link,
			label: t('common.markdown_link'),
			onClick: () =>
				applyWrap({ before: '[', after: '](url)', placeholder: t('common.markdown_link') }),
		},
	]

	return (
		<div
			className={cn(
				'flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-transparent p-2',
				className
			)}
		>
			<div className='flex items-center gap-0.5'>
				{tools.map(tool => (
					<button
						key={tool.label}
						type='button'
						aria-label={tool.label}
						onClick={tool.onClick}
						className='flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<tool.icon className='size-3.5' />
					</button>
				))}
			</div>
			<Textarea
				ref={textareaRef}
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				rows={rows}
				className='resize-none border-none px-2 py-1 shadow-none focus-visible:ring-0'
			/>
		</div>
	)
}
