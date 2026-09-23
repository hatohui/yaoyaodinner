import { useTranslation } from 'react-i18next'
import { ShoppingBag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SelectionBarProps {
	count: number
	onClear: () => void
	onAdd: () => void
}

export function SelectionBar({ count, onClear, onAdd }: SelectionBarProps) {
	const { t } = useTranslation()

	if (count === 0) return null

	return (
		<div className='fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-xl shadow-primary/15 ring-1 ring-primary/10'>
			<button
				type='button'
				onClick={onClear}
				aria-label={t('menu.clear_selection')}
				className='rounded-full p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'
			>
				<X className='size-4' />
			</button>

			<span className='text-sm font-medium text-foreground'>
				{t('menu.selected_count', { count })}
			</span>

			<Button size='sm' className='gap-1.5 rounded-full' onClick={onAdd}>
				<ShoppingBag className='size-4' />
				{t('menu.add_to_order')}
			</Button>
		</div>
	)
}
