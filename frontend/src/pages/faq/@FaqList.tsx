import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

const QUESTIONS = [
	'wrong_identity',
	'table_code',
	'find_table',
	'order',
	'split',
	'edit_me',
	'switch_table',
	'feedback',
] as const

export function FaqList() {
	const { t } = useTranslation()

	return (
		<div className='flex flex-col gap-2'>
			{QUESTIONS.map(id => (
				<details
					key={id}
					className='group rounded-2xl border border-border bg-card shadow-sm transition-colors open:border-primary/40'
				>
					<summary className='flex list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden'>
						{t(`faq.${id}_q`)}
						<ChevronDown className='size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180' />
					</summary>
					<p className='px-5 pb-4 leading-relaxed text-muted-foreground'>
						{t(`faq.${id}_a`)}
					</p>
				</details>
			))}
		</div>
	)
}
