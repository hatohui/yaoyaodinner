import { useTranslation } from 'react-i18next'
import { KeyRound, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface TableCodeChipProps {
	code?: string
	onReroll: () => void
}

export function TableCodeChip({ code, onReroll }: TableCodeChipProps) {
	const { t } = useTranslation()
	const toast = useToast()

	if (!code) return null

	const copy = () => {
		navigator.clipboard?.writeText(code)
		toast.success(t('table_code.copied'))
	}

	return (
		<span className='flex items-center rounded-full border border-border bg-control pl-2.5 text-xs'>
			<button
				type='button'
				onClick={copy}
				aria-label={t('table_code.copy')}
				title={t('table_code.copy')}
				className='flex cursor-pointer items-center gap-1.5 font-mono font-semibold tracking-widest text-foreground'
			>
				<KeyRound className='size-3 text-primary' />
				{code}
			</button>
			<button
				type='button'
				onClick={onReroll}
				aria-label={t('table_code.reroll')}
				title={t('table_code.reroll')}
				className='ml-1 cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'
			>
				<RefreshCw className='size-3' />
			</button>
		</span>
	)
}
