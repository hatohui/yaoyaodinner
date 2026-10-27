import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OrderResponseDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

interface PriceDialogProps {
	order: OrderResponseDto | null
	onOpenChange: (open: boolean) => void
	onSave: (price: number) => void
}

/** The restaurant's bill can differ from the menu, so dinner prices can be corrected. */
export function PriceDialog({ order, onOpenChange, onSave }: PriceDialogProps) {
	const { t } = useTranslation()
	const [draft, setDraft] = useState('')

	useEffect(() => {
		if (order) setDraft(String(order.price))
	}, [order])

	const price = Number(draft)
	const valid = draft.trim() !== '' && Number.isFinite(price) && price >= 0

	return (
		<Dialog open={order !== null} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-sm'>
				<DialogHeader>
					<DialogTitle>{t('orders.edit_price')}</DialogTitle>
					<DialogDescription>
						{order?.foodName}
						{order?.variantLabel ? ` - ${order.variantLabel}` : ''}
					</DialogDescription>
				</DialogHeader>
				<form
					className='flex flex-col gap-4'
					onSubmit={e => {
						e.preventDefault()
						if (valid) onSave(Math.round(price * 100) / 100)
					}}
				>
					<label className='flex flex-col gap-1.5 text-sm'>
						<span className='text-muted-foreground'>
							{t('orders.unit_price', { currency: order?.currency ?? '' })}
						</span>
						<Input
							type='number'
							inputMode='decimal'
							min={0}
							step='0.01'
							value={draft}
							onChange={e => setDraft(e.target.value)}
							autoFocus
						/>
					</label>
					<DialogFooter>
						<Button type='submit' disabled={!valid} className='rounded-full'>
							{t('common.save')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
