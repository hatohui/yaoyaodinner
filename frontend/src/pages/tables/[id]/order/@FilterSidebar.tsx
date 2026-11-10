import { useTranslation } from 'react-i18next'
import { ArrowUpDown, Flame, Sparkles } from 'lucide-react'
import type { CategoryItemDto, FoodSuggestionDto } from '@/api/model'
import type { MenuSort } from '@/utils/searchParams'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/shadcn'
import type { CategoriesState } from '@/pages/menu/@FilterBar'
import { SearchSuggest } from '@/pages/menu/@SearchSuggest'

interface FilterSidebarProps {
	search: string
	onSearchChange: (value: string) => void
	onSuggestionSelect?: (suggestion: FoodSuggestionDto) => void
	activeCategory: string
	categories: CategoryItemDto[]
	categoriesState: CategoriesState
	sort: MenuSort
	onSortChange: (value: MenuSort) => void
	popular: boolean
	recommended: boolean
	onFilterChange: (filter: {
		category: string
		popular: boolean
		recommended: boolean
	}) => void
}

const itemClass =
	'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors'
const activeClass = 'bg-primary text-primary-foreground shadow-sm'
const idleClass = 'text-foreground/85 hover:bg-primary/10 hover:text-primary'

/** Desktop filters for ordering: search, sort and a vertical category list. */
export function FilterSidebar({
	search,
	onSearchChange,
	onSuggestionSelect,
	activeCategory,
	categories,
	categoriesState,
	sort,
	onSortChange,
	popular,
	recommended,
	onFilterChange,
}: FilterSidebarProps) {
	const { t } = useTranslation()
	const plain = !popular && !recommended
	const pick = (
		category: string,
		flags = { popular: false, recommended: false }
	) => onFilterChange({ category, ...flags })

	return (
		<div className='flex max-h-[calc(100vh-6rem)] flex-col gap-4 rounded-2xl border border-border bg-card p-3 shadow-sm'>
			<div className='shrink-0'>
				<SearchSuggest
					value={search}
					onChange={onSearchChange}
					onSelect={onSuggestionSelect}
				/>
			</div>

			<Select value={sort} onValueChange={val => onSortChange(val as MenuSort)}>
				<SelectTrigger className='w-full shrink-0 gap-1.5 rounded-full border-border bg-card font-semibold *:data-[slot=select-value]:flex-1 data-[size=default]:h-10 dark:bg-white/10 dark:hover:bg-white/15'>
					<ArrowUpDown className='size-3.5 shrink-0 text-foreground/75' />
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value='name'>{t('menu.sort_name')}</SelectItem>
					<SelectItem value='name_desc'>{t('menu.sort_name_desc')}</SelectItem>
					<SelectItem value='price'>{t('menu.sort_price')}</SelectItem>
					<SelectItem value='price_desc'>
						{t('menu.sort_price_desc')}
					</SelectItem>
					<SelectItem value='popular'>{t('menu.sort_popular')}</SelectItem>
				</SelectContent>
			</Select>

			<nav
				aria-label={t('menu.categories')}
				className='scrollbar-thin flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto'
			>
				<p className='m-0 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
					{t('menu.categories')}
				</p>
				{categoriesState === 'loading' ? (
					Array.from({ length: 8 }, (_, i) => (
						<Skeleton key={i} className='mx-1 my-1 h-7 rounded-xl' />
					))
				) : (
					<>
						{categoriesState === 'ready' && (
							<>
								<button
									type='button'
									aria-pressed={popular}
									onClick={() =>
										pick('all', { popular: true, recommended: false })
									}
									className={cn(itemClass, popular ? activeClass : idleClass)}
								>
									<Flame className='size-4 shrink-0' />
									{t('menu.popular')}
								</button>
								<button
									type='button'
									aria-pressed={recommended}
									onClick={() =>
										pick('all', { popular: false, recommended: true })
									}
									className={cn(
										itemClass,
										recommended ? activeClass : idleClass
									)}
								>
									<Sparkles className='size-4 shrink-0' />
									{t('menu.recommended')}
								</button>
								<div className='my-1 border-t border-border/60' />
							</>
						)}
						<button
							type='button'
							aria-pressed={plain && activeCategory === 'all'}
							onClick={() => pick('all')}
							className={cn(
								itemClass,
								plain && activeCategory === 'all' ? activeClass : idleClass
							)}
						>
							{t('menu.all_categories')}
						</button>
						{categories.map(cat => {
							const active = plain && activeCategory === cat.id
							return (
								<button
									key={cat.id}
									type='button'
									aria-pressed={active}
									onClick={() => pick(cat.id)}
									className={cn(itemClass, active ? activeClass : idleClass)}
								>
									<span className='truncate'>{cat.name ?? cat.key}</span>
								</button>
							)
						})}
					</>
				)}
			</nav>
		</div>
	)
}
