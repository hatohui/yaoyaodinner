import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Search, UtensilsCrossed } from 'lucide-react'
import { useGetFoodsForAdmin } from '@/api/foods/foods'
import type {
	CategoryItemDto,
	GetFoodsForAdminResponseDto,
	PresetMenuItemDto,
} from '@/api/model'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { StoredImage } from '@/components/common/StoredImage'
import { PaginationBar } from '@/components/common/PaginationBar'
import { usePagination } from '@/hooks/usePagination'
import { cn } from '@/utils/shadcn'
import { CreateFoodDialog } from '../food/@CreateFoodDialog'

interface AddPresetItemDialogProps {
	trigger: React.ReactNode
	existingItems: PresetMenuItemDto[]
	lang: string
	onAdd: (variantId: string) => void
	categories: CategoryItemDto[]
	creatingFood: boolean
	onCreateFood: (
		name: string,
		categoryId: string,
		price: number,
		imageUrl?: string
	) => void
}

export function AddPresetItemDialog({
	trigger,
	existingItems,
	lang,
	onAdd,
	categories,
	creatingFood,
	onCreateFood,
}: AddPresetItemDialogProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [categoryId, setCategoryId] = useState('all')

	const [total, setTotal] = useState(0)
	const pagination = usePagination({ total, initialCount: 20 })

	const { data, isLoading } = useGetFoodsForAdmin<GetFoodsForAdminResponseDto>({
		lang,
		page: pagination.page,
		count: pagination.count,
		search: search || undefined,
		category: categoryId,
	})

	useEffect(() => {
		if (data?.total !== undefined) setTotal(data.total)
	}, [data?.total])

	const existingFoodIds = new Set(existingItems.map(i => i.foodId))

	const foods = (data?.foods ?? []).flatMap(food => {
		const variantId = food.defaultVariantId ?? food.variants[0]?.id
		return variantId ? [{ ...food, variantId }] : []
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='flex max-h-[80vh] flex-col gap-4 overflow-hidden'>
				<DialogHeader>
					<DialogTitle>{t('admin.presets.add_item_title')}</DialogTitle>
				</DialogHeader>

				<div className='flex items-center gap-2'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							value={search}
							onChange={e => {
								setSearch(e.target.value)
								pagination.setPage(1)
							}}
							placeholder={t('menu.search_placeholder')}
							className='rounded-full pl-9'
						/>
					</div>
					<CreateFoodDialog
						categories={categories}
						pending={creatingFood}
						onCreate={(...args) => {
							onCreateFood(...args)
							setOpen(false)
						}}
					/>
				</div>

				<Select
					value={categoryId}
					onValueChange={value => {
						setCategoryId(value)
						pagination.setPage(1)
					}}
				>
					<SelectTrigger className='w-full rounded-full'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>{t('menu.all_categories')}</SelectItem>
						{categories.map(c => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{isLoading ? (
					<div className='flex justify-center py-8'>
						<Spinner />
					</div>
				) : foods.length === 0 ? (
					<p className='py-8 text-center text-sm text-muted-foreground'>
						{t('admin.food.empty')}
					</p>
				) : (
					<div className='scrollbar-thin flex flex-col gap-0.5 overflow-y-auto pr-1'>
						{foods.map(food => {
							const already = existingFoodIds.has(food.id)
							return (
								<button
									key={food.id}
									type='button'
									disabled={already}
									onClick={() => {
										onAdd(food.variantId)
										setOpen(false)
									}}
									className={cn(
										'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
										already ? 'cursor-default opacity-40' : 'hover:bg-accent'
									)}
								>
									<StoredImage
										imageKey={food.imageUrl}
										alt={food.name}
										className='size-12 shrink-0 rounded-lg object-cover'
										fallback={
											<div className='flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
												<UtensilsCrossed className='size-5' />
											</div>
										}
									/>
									<p className='min-w-0 flex-1 truncate text-sm font-medium text-foreground'>
										{food.name}
									</p>
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

				<PaginationBar pagination={pagination} />
			</DialogContent>
		</Dialog>
	)
}
