import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData } from '@tanstack/react-query'
import { PenLine, Plus } from 'lucide-react'
import { useGetFoods } from '@/api/foods/foods'
import type { GetFoodsResponseDto } from '@/api/model'
import { Input } from '@/components/ui/input'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { useDebounce } from '@/hooks/useDebounce'
import type { NewWish } from '@/hooks/useTableWishes'
import { STALE_TIME_STATIC } from '@/common/constants'

const MIN_SEARCH = 2
const MAX_LABEL = 120

interface WishAddFormProps {
	placeholder: string
	onAdd: (wish: Omit<NewWish, 'kind'>) => void
}

export function WishAddForm({ placeholder, onAdd }: WishAddFormProps) {
	const { t, i18n } = useTranslation()
	const [query, setQuery] = useState('')
	const search = useDebounce(query.trim(), 250)
	const searching = search.length >= MIN_SEARCH

	const { data } = useGetFoods<GetFoodsResponseDto>(
		{ lang: i18n.language, page: 1, count: 5, search },
		{
			query: {
				enabled: searching,
				staleTime: STALE_TIME_STATIC,
				placeholderData: keepPreviousData,
			},
		}
	)
	const results = searching
		? (data?.foods ?? []).filter(f => f.defaultVariantId)
		: []
	const typed = query.trim()

	const pick = (wish: Omit<NewWish, 'kind'>) => {
		onAdd(wish)
		setQuery('')
	}

	return (
		<div className='flex flex-col gap-1.5'>
			<Input
				value={query}
				maxLength={MAX_LABEL}
				placeholder={placeholder}
				onChange={e => setQuery(e.target.value)}
				onKeyDown={e => {
					if (e.key !== 'Enter' || !typed) return
					e.preventDefault()
					const first = results[0]
					pick(
						first?.defaultVariantId
							? { variantId: first.defaultVariantId, food: first }
							: { label: typed }
					)
				}}
				className='h-9 rounded-xl'
			/>
			{typed.length >= MIN_SEARCH && (
				<ul className='flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
					{results.map(food => (
						<li key={food.id}>
							<button
								type='button'
								onClick={() =>
									pick({ variantId: food.defaultVariantId!, food })
								}
								className='flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10'
							>
								<OrderThumb
									imageKey={food.imageUrl}
									alt={food.name}
									className='size-8 rounded-lg'
								/>
								<span className='min-w-0 flex-1 truncate'>{food.name}</span>
								<Plus className='size-4 shrink-0 text-primary' />
							</button>
						</li>
					))}
					<li>
						<button
							type='button'
							onClick={() => pick({ label: typed })}
							className='flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground'
						>
							<span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
								<PenLine className='size-4' />
							</span>
							<span className='min-w-0 flex-1 truncate'>
								{t('plan_board.add_custom', { name: typed })}
							</span>
						</button>
					</li>
				</ul>
			)}
		</div>
	)
}
