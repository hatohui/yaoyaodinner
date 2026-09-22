import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { useGetFoodsForAdmin } from '@/api/foods/foods'
import type { GetFoodsForAdminResponseDto, PresetMenuItemDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/shadcn'

interface AddPresetItemDialogProps {
	trigger: React.ReactNode
	existingItems: PresetMenuItemDto[]
	lang: string
	onAdd: (variantId: string) => void
}

export function AddPresetItemDialog({
	trigger,
	existingItems,
	lang,
	onAdd,
}: AddPresetItemDialogProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')

	const { data, isLoading } = useGetFoodsForAdmin<GetFoodsForAdminResponseDto>({
		lang,
		page: 1,
		count: 100,
		search: search || undefined,
	})

	const existingVariantIds = new Set(existingItems.map(i => i.variantId))

	const allVariants = (data?.foods ?? []).flatMap(food =>
		food.variants.map(v => ({
			variantId: v.id,
			foodName: food.name,
			variantLabel: v.label,
			price: v.price,
			currency: v.currency,
		}))
	)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='flex max-h-[80vh] flex-col gap-4 overflow-hidden'>
				<DialogHeader>
					<DialogTitle>{t('admin.presets.add_item_title')}</DialogTitle>
				</DialogHeader>

				<div className='relative'>
					<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
					<Input
						value={search}
						onChange={e => setSearch(e.target.value)}
						placeholder={t('menu.search_placeholder')}
						className='rounded-full pl-9'
					/>
				</div>

				{isLoading ? (
					<div className='flex justify-center py-8'>
						<Spinner />
					</div>
				) : allVariants.length === 0 ? (
					<p className='py-8 text-center text-sm text-muted-foreground'>
						{t('admin.food.empty')}
					</p>
				) : (
					<div className='scrollbar-thin flex flex-col gap-0.5 overflow-y-auto pr-1'>
						{allVariants.map(v => {
							const already = existingVariantIds.has(v.variantId)
							return (
								<button
									key={v.variantId}
									type='button'
									disabled={already}
									onClick={() => {
										onAdd(v.variantId)
										setOpen(false)
									}}
									className={cn(
										'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
										already
											? 'cursor-default opacity-40'
											: 'hover:bg-accent'
									)}
								>
									<div className='min-w-0 flex-1'>
										<p className='truncate text-sm font-medium text-foreground'>
											{v.foodName}
										</p>
										<p className='text-xs text-muted-foreground'>
											{v.variantLabel}
											{v.price != null && ` · ${v.price} ${v.currency}`}
										</p>
									</div>
									{already && (
										<span className='shrink-0 text-xs text-muted-foreground'>
											{t('admin.presets.already_added')}
										</span>
									)}
								</button>
							)
						})}
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
