import { useTranslation } from 'react-i18next'
import { Minus, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import type { CategoryItemDto, PresetMenuItemDto } from '@/api/model'
import { StoredImage } from '@/components/common/StoredImage'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AddPresetItemDialog } from './@AddPresetItemDialog'

interface PresetItemsListProps {
	items: PresetMenuItemDto[]
	isLoading: boolean
	lang: string
	onQuantityChange: (variantId: string, quantity: number) => void
	onRemoveItem: (variantId: string) => void
	onAddItem: (variantId: string) => void
	categories: CategoryItemDto[]
	creatingFood: boolean
	onCreateFood: (
		name: string,
		categoryId: string,
		price: number,
		imageUrl?: string
	) => Promise<unknown>
}

export function PresetItemsList({
	items,
	isLoading,
	lang,
	onQuantityChange,
	onRemoveItem,
	onAddItem,
	categories,
	creatingFood,
	onCreateFood,
}: PresetItemsListProps) {
	const { t } = useTranslation()

	if (isLoading) {
		return (
			<div className='flex justify-center py-16'>
				<Spinner />
			</div>
		)
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex justify-end'>
				<AddPresetItemDialog
					trigger={
						<Button size='sm' className='gap-1.5 rounded-full'>
							<Plus data-icon='inline-start' />
							{t('admin.presets.add_item')}
						</Button>
					}
					existingItems={items}
					lang={lang}
					onAdd={onAddItem}
					categories={categories}
					creatingFood={creatingFood}
					onCreateFood={onCreateFood}
				/>
			</div>

			{items.length === 0 ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('admin.presets.items_empty')}
				</p>
			) : (
				<ul className='flex flex-col gap-2'>
					{items.map(item => (
						<li
							key={item.variantId}
							className='flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2.5'
						>
							<StoredImage
								imageKey={item.imageUrl}
								alt={item.foodName}
								className='size-12 shrink-0 rounded-lg object-cover'
								fallback={
									<div className='flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
										<UtensilsCrossed className='size-5' />
									</div>
								}
							/>
							<p className='min-w-0 flex-1 truncate text-sm font-medium text-foreground'>
								{item.foodName}
							</p>
							<div className='flex items-center gap-1.5'>
								<Button
									size='icon-xs'
									variant='outline'
									className='rounded-full border-border bg-muted/60 text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
									disabled={item.quantity <= 1}
									onClick={() =>
										onQuantityChange(item.variantId, item.quantity - 1)
									}
								>
									<Minus />
								</Button>
								<span className='w-6 text-center text-sm font-medium text-foreground'>
									{item.quantity}
								</span>
								<Button
									size='icon-xs'
									variant='outline'
									className='rounded-full border-border bg-muted/60 text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
									onClick={() =>
										onQuantityChange(item.variantId, item.quantity + 1)
									}
								>
									<Plus />
								</Button>
							</div>
							<Button
								size='icon-xs'
								variant='ghost'
								className='rounded-full text-muted-foreground hover:text-destructive'
								onClick={() => onRemoveItem(item.variantId)}
							>
								<Trash2 />
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
