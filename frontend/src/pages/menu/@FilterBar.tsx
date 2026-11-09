import { useTranslation } from 'react-i18next'
import { ArrowUpDown, Flame, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/shadcn'
import type { CategoryItemDto, FoodSuggestionDto } from '@/api/model'
import { SearchSuggest } from './@SearchSuggest'
import { ViewToggle, type ListView } from '@/components/common/ViewToggle'
import type { MenuSort } from '@/utils/searchParams'

interface MenuFilter {
	category: string
	popular: boolean
	recommended: boolean
}

export type CategoriesState = 'loading' | 'error' | 'ready'

const PILL_SKELETON_WIDTHS = [
	'w-24',
	'w-24',
	'w-16',
	'w-20',
	'w-16',
	'w-24',
	'w-20',
	'w-16',
]

interface FilterBarProps {
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
	onFilterChange: (filter: MenuFilter) => void
	view?: ListView
	onViewChange?: (view: ListView) => void
}

export function FilterBar({
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
	view,
	onViewChange,
}: FilterBarProps) {
	const { t } = useTranslation()

	return (
		<div className='sticky top-14 z-20 w-full border-b border-border bg-card shadow-xs'>
			<div className='relative mx-auto max-w-[1400px] px-4 py-3 sm:py-3.5'>
				{/* Search & Sort Controls (Desktop has Sort next to Search) */}
				<div className='flex items-center gap-2 sm:gap-3'>
					<SearchSuggest
						value={search}
						onChange={onSearchChange}
						onSelect={onSuggestionSelect}
					/>

					{/* Desktop-only Sort dropdown in Row 1 */}
					<div className='hidden shrink-0 sm:flex'>
						<Select
							value={sort}
							onValueChange={val => onSortChange(val as MenuSort)}
						>
							<SelectTrigger className='*:data-[slot=select-value]:flex-1 data-[size=default]:h-10 w-44 gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-xs transition-all hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15'>
								<ArrowUpDown className='size-3.5 shrink-0 text-foreground/75' />
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='end'>
								<SelectItem value='name'>{t('menu.sort_name')}</SelectItem>
								<SelectItem value='name_desc'>
									{t('menu.sort_name_desc')}
								</SelectItem>
								<SelectItem value='price'>{t('menu.sort_price')}</SelectItem>
								<SelectItem value='price_desc'>
									{t('menu.sort_price_desc')}
								</SelectItem>
								<SelectItem value='popular'>
									{t('menu.sort_popular')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{view && onViewChange && (
						<div className='hidden shrink-0 sm:flex'>
							<ViewToggle view={view} onChange={onViewChange} />
						</div>
					)}
				</div>

				{/* Desktop: Wrapped Category Pills */}
				<div
					aria-busy={categoriesState === 'loading'}
					className='mt-2.5 hidden flex-wrap gap-2 pt-0.5 sm:flex'
				>
					{categoriesState === 'loading' ? (
						PILL_SKELETON_WIDTHS.map((width, i) => (
							<Skeleton key={i} className={cn('h-8.5 rounded-full', width)} />
						))
					) : (
						<>
							{categoriesState === 'ready' && (
								<>
									<CategoryPill
										label={t('menu.popular')}
										icon={Flame}
										active={popular}
										onClick={() =>
											onFilterChange({
												category: 'all',
												popular: true,
												recommended: false,
											})
										}
									/>
									<CategoryPill
										label={t('menu.recommended')}
										icon={Sparkles}
										active={recommended}
										onClick={() =>
											onFilterChange({
												category: 'all',
												popular: false,
												recommended: true,
											})
										}
									/>
								</>
							)}
							<CategoryPill
								label={t('menu.all_categories')}
								active={activeCategory === 'all' && !popular && !recommended}
								onClick={() =>
									onFilterChange({
										category: 'all',
										popular: false,
										recommended: false,
									})
								}
							/>
							{categories.map(cat => (
								<CategoryPill
									key={cat.id}
									label={cat.name ?? cat.key}
									active={activeCategory === cat.id && !popular && !recommended}
									onClick={() =>
										onFilterChange({
											category: cat.id,
											popular: false,
											recommended: false,
										})
									}
								/>
							))}
						</>
					)}
				</div>

				{/* Mobile: 2-column Grid for Sort and Category Selects */}
				<div
					className={cn(
						'mt-2.5 grid gap-2 sm:hidden',
						view && onViewChange
							? 'grid-cols-[1fr_1fr_auto] items-center'
							: 'grid-cols-2'
					)}
				>
					<Select
						value={sort}
						onValueChange={val => onSortChange(val as MenuSort)}
					>
						<SelectTrigger className='*:data-[slot=select-value]:flex-1 data-[size=default]:h-9.5 w-full rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15'>
							<ArrowUpDown className='size-3.5 shrink-0 text-foreground/75' />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='name'>{t('menu.sort_name')}</SelectItem>
							<SelectItem value='name_desc'>
								{t('menu.sort_name_desc')}
							</SelectItem>
							<SelectItem value='price'>{t('menu.sort_price')}</SelectItem>
							<SelectItem value='price_desc'>
								{t('menu.sort_price_desc')}
							</SelectItem>
							<SelectItem value='popular'>{t('menu.sort_popular')}</SelectItem>
						</SelectContent>
					</Select>

					<Select
						disabled={categoriesState === 'loading'}
						value={
							popular ? 'popular' : recommended ? 'recommended' : activeCategory
						}
						onValueChange={val =>
							onFilterChange({
								category:
									val === 'popular' || val === 'recommended' ? 'all' : val,
								popular: val === 'popular',
								recommended: val === 'recommended',
							})
						}
					>
						<SelectTrigger
							className={cn(
								'*:data-[slot=select-value]:flex-1 data-[size=default]:h-9.5 w-full rounded-full border px-3 text-xs font-semibold shadow-xs transition-all',
								'border-border bg-card text-foreground hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15',
								(activeCategory !== 'all' || popular || recommended) &&
									'border-primary/60 bg-primary/10 text-primary dark:border-primary/60 dark:bg-primary/20 dark:text-primary-foreground'
							)}
						>
							{popular ? (
								<Flame className='size-3.5 shrink-0 text-primary' />
							) : recommended ? (
								<Sparkles className='size-3.5 shrink-0 text-primary' />
							) : null}
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{categoriesState === 'ready' && (
								<>
									<SelectItem value='popular'>
										<span className='flex items-center gap-1.5'>
											<Flame className='size-3.5 text-primary' />
											{t('menu.popular')}
										</span>
									</SelectItem>
									<SelectItem value='recommended'>
										<span className='flex items-center gap-1.5'>
											<Sparkles className='size-3.5 text-primary' />
											{t('menu.recommended')}
										</span>
									</SelectItem>
								</>
							)}
							<SelectItem value='all'>{t('menu.all_categories')}</SelectItem>
							{categories.map(cat => (
								<SelectItem key={cat.id} value={cat.id}>
									{cat.name ?? cat.key}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{view && onViewChange && (
						<ViewToggle view={view} onChange={onViewChange} />
					)}
				</div>
			</div>
		</div>
	)
}

function CategoryPill({
	label,
	icon: Icon,
	active,
	onClick,
}: {
	label: string
	icon?: typeof Flame
	active: boolean
	onClick: () => void
}) {
	const activeClass =
		'border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/20'

	const inactiveClass =
		'border-border bg-card text-foreground/90 hover:border-primary/50 hover:bg-primary/15 hover:text-primary dark:border-white/20 dark:bg-white/10 dark:hover:border-primary/60 dark:hover:bg-primary/20 dark:hover:text-primary'

	return (
		<button
			type='button'
			onClick={onClick}
			className={cn(
				'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer',
				active ? activeClass : inactiveClass
			)}
		>
			{Icon && <Icon className='size-3.5' />}
			{label}
		</button>
	)
}
