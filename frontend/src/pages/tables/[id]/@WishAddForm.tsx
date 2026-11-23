import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData } from '@tanstack/react-query'
import { Check, Flame, PenLine, Plus, Search } from 'lucide-react'
import { useGetFoods } from '@/api/foods/foods'
import type { FoodItemDto, GetFoodsResponseDto } from '@/api/model'
import { Input } from '@/components/ui/input'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { useDebounce } from '@/hooks/useDebounce'
import type { WishDraft } from '@/hooks/useTableWishes'
import { STALE_TIME_STATIC } from '@/common/constants'
import { cn } from '@/utils/shadcn'
import { useFoodPriceLabel, usePopularFoods } from './@usePopularFoods'

const MIN_SEARCH = 2
const MAX_LABEL = 120
const RESULT_COUNT = 6

interface WishAddFormProps {
	placeholder: string
	plannedFoodIds: Set<string>
	onAdd: (wish: WishDraft) => void
}

export function WishAddForm({
	placeholder,
	plannedFoodIds,
	onAdd,
}: WishAddFormProps) {
	const { t, i18n } = useTranslation()
	const inputRef = useRef<HTMLInputElement>(null)
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(0)
	const search = useDebounce(query.trim(), 250)
	const searching = search.length >= MIN_SEARCH
	const typed = query.trim()
	const browsing = open && typed.length === 0

	const { data } = useGetFoods<GetFoodsResponseDto>(
		{ lang: i18n.language, page: 1, count: RESULT_COUNT, search },
		{
			query: {
				enabled: searching,
				staleTime: STALE_TIME_STATIC,
				placeholderData: keepPreviousData,
			},
		}
	)
	const popular = usePopularFoods(open)
	const priceOf = useFoodPriceLabel()
	const results = browsing
		? popular.slice(0, RESULT_COUNT)
		: searching
			? (data?.foods ?? []).filter(f => f.defaultVariantId)
			: []
	const showCustom = typed.length >= MIN_SEARCH
	const optionCount = results.length + (showCustom ? 1 : 0)
	const showList = open && (browsing ? results.length > 0 : showCustom)

	const pickFood = (food: FoodItemDto) => {
		if (plannedFoodIds.has(food.id)) return
		onAdd({ variantId: food.defaultVariantId!, food })
		setQuery('')
		setActive(0)
		inputRef.current?.focus()
	}
	const pickCustom = () => {
		onAdd({ label: typed })
		setQuery('')
		setActive(0)
		inputRef.current?.focus()
	}
	const pickActive = () => {
		const food = results[active]
		if (food) pickFood(food)
		else if (showCustom) pickCustom()
	}

	return (
		<div className='relative'>
			<div className='relative'>
				<Search className='pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:size-4' />
				<Input
					ref={inputRef}
					value={query}
					maxLength={MAX_LABEL}
					placeholder={placeholder}
					role='combobox'
					aria-expanded={showList}
					onFocus={() => setOpen(true)}
					onBlur={() => setOpen(false)}
					onChange={e => {
						setQuery(e.target.value)
						setActive(0)
						setOpen(true)
					}}
					onKeyDown={e => {
						if (e.key === 'Escape') {
							setOpen(false)
						} else if (e.key === 'ArrowDown' && optionCount > 0) {
							e.preventDefault()
							setOpen(true)
							setActive(i => (i + 1) % optionCount)
						} else if (e.key === 'ArrowUp' && optionCount > 0) {
							e.preventDefault()
							setActive(i => (i - 1 + optionCount) % optionCount)
						} else if (e.key === 'Enter' && optionCount > 0) {
							e.preventDefault()
							pickActive()
						}
					}}
					className='h-9 rounded-xl pl-8 placeholder:text-sm sm:pl-9'
				/>
			</div>
			{showList && (
				<ul
					role='listbox'
					onMouseDown={e => e.preventDefault()}
					className='scrollbar-thin absolute inset-x-0 top-full z-40 mt-1.5 flex max-h-[min(22rem,60vh)] flex-col overflow-y-auto rounded-xl border border-border bg-popover shadow-lg'
				>
					{browsing && (
						<li className='flex items-center gap-1.5 px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground'>
							<Flame className='size-3' />
							{t('menu.popular')}
						</li>
					)}
					{results.map((food, index) => {
						const planned = plannedFoodIds.has(food.id)
						return (
							<li key={food.id} role='option' aria-selected={index === active}>
								<button
									type='button'
									disabled={planned}
									onClick={() => pickFood(food)}
									onMouseEnter={() => setActive(index)}
									className={cn(
										'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors disabled:cursor-default',
										index === active && !planned && 'bg-primary/10'
									)}
								>
									<OrderThumb
										imageKey={food.imageUrl}
										alt={food.name}
										className='size-9 rounded-lg'
									/>
									<span className='flex min-w-0 flex-1 flex-col'>
										<span
											className={cn(
												'truncate',
												planned && 'text-muted-foreground'
											)}
										>
											{food.name}
										</span>
										<span className='text-xs tabular-nums text-muted-foreground'>
											{planned ? t('plan_board.in_plan') : priceOf(food)}
										</span>
									</span>
									{planned ? (
										<Check className='size-4 shrink-0 text-muted-foreground' />
									) : (
										<span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
											<Plus className='size-4' />
										</span>
									)}
								</button>
							</li>
						)
					})}
					{showCustom && (
						<li role='option' aria-selected={active === results.length}>
							<button
								type='button'
								onClick={pickCustom}
								onMouseEnter={() => setActive(results.length)}
								className={cn(
									'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground',
									active === results.length && 'bg-primary/10'
								)}
							>
								<span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted'>
									<PenLine className='size-4' />
								</span>
								<span className='min-w-0 flex-1 truncate'>
									{t('plan_board.add_custom', { name: typed })}
								</span>
							</button>
						</li>
					)}
				</ul>
			)}
		</div>
	)
}
