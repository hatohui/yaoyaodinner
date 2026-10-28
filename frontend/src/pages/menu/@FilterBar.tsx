import { useTranslation } from 'react-i18next'
import { ArrowUpDown, Flame, Search, Sparkles, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/shadcn'
import type { CategoryItemDto } from '@/api/model'
import type { MenuSort } from '@/utils/searchParams'

interface MenuFilter {
	category: string
	popular: boolean
	recommended: boolean
}

interface FilterBarProps {
	search: string
	onSearchChange: (value: string) => void
	activeCategory: string
	categories: CategoryItemDto[]
	sort: MenuSort
	onSortChange: (value: MenuSort) => void
	popular: boolean
	recommended: boolean
	onFilterChange: (filter: MenuFilter) => void
}

export function FilterBar({
	search,
	onSearchChange,
	activeCategory,
	categories,
	sort,
	onSortChange,
	popular,
	recommended,
	onFilterChange,
}: FilterBarProps) {
	const { t } = useTranslation()

	return (
		<div className='sticky top-14 z-20 w-full border-b border-border/90 bg-card/90 backdrop-blur-xl shadow-xs transition-colors dark:border-white/15 dark:bg-card/85'>
			{/* Ambient soft glow highlights */}
			<div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
				<div className='absolute -left-16 -top-16 size-72 rounded-full bg-primary/10 blur-3xl' />
				<div className='absolute right-8 -top-16 size-72 rounded-full bg-amber-500/10 blur-3xl' />
			</div>

			<div className='relative mx-auto max-w-[1400px] px-4 py-3 sm:py-3.5'>
				{/* Search & Sort Controls (Desktop has Sort next to Search) */}
				<div className='flex items-center gap-2 sm:gap-3'>
					<div className='relative flex-1'>
						<Search className='absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/60 transition-colors' />
						<Input
							placeholder={t('menu.search_placeholder')}
							value={search}
							onChange={e => onSearchChange(e.target.value)}
							className='h-10 rounded-full border border-border/90 bg-background/90 pl-9.5 pr-8 text-sm text-foreground shadow-xs transition-all placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-white/20 dark:bg-white/10 dark:placeholder:text-white/50'
						/>
						{search && (
							<button
								type='button'
								onClick={() => onSearchChange('')}
								className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
								aria-label='Clear search'
							>
								<X className='size-3.5' />
							</button>
						)}
					</div>

					{/* Desktop-only Sort dropdown in Row 1 */}
					<div className='hidden shrink-0 sm:flex'>
						<Select
							value={sort}
							onValueChange={val => onSortChange(val as MenuSort)}
						>
							<SelectTrigger className='h-10 w-44 gap-1.5 rounded-full border border-border/90 bg-background/90 px-3.5 text-sm font-semibold text-foreground shadow-xs transition-all hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15'>
								<ArrowUpDown className='size-3.5 shrink-0 text-foreground/75' />
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='end'>
								<SelectItem value='name'>{t('menu.sort_name')}</SelectItem>
								<SelectItem value='price'>{t('menu.sort_price')}</SelectItem>
								<SelectItem value='price_desc'>
									{t('menu.sort_price_desc')}
								</SelectItem>
								<SelectItem value='popular'>{t('menu.sort_popular')}</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Desktop: Wrapped Category Pills */}
				<div className='mt-2.5 hidden flex-wrap gap-2 pt-0.5 sm:flex'>
					<CategoryPill
						label={t('menu.popular')}
						icon={Flame}
						variant='popular'
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
						variant='recommended'
						active={recommended}
						onClick={() =>
							onFilterChange({
								category: 'all',
								popular: false,
								recommended: true,
							})
						}
					/>
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
				</div>

				{/* Mobile: 2-column Grid for Sort and Category Selects */}
				<div className='mt-2.5 grid grid-cols-2 gap-2 sm:hidden'>
					<Select
						value={sort}
						onValueChange={val => onSortChange(val as MenuSort)}
					>
						<SelectTrigger className='h-9.5 w-full rounded-full border border-border/90 bg-background/90 px-3 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15'>
							<ArrowUpDown className='size-3.5 shrink-0 text-foreground/75' />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='name'>{t('menu.sort_name')}</SelectItem>
							<SelectItem value='price'>{t('menu.sort_price')}</SelectItem>
							<SelectItem value='price_desc'>
								{t('menu.sort_price_desc')}
							</SelectItem>
							<SelectItem value='popular'>{t('menu.sort_popular')}</SelectItem>
						</SelectContent>
					</Select>

					<Select
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
								'h-9.5 w-full rounded-full border px-3 text-xs font-semibold shadow-xs transition-all',
								'border-border/90 bg-background/90 text-foreground hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15',
								(activeCategory !== 'all' || popular || recommended) &&
									'border-primary/60 bg-primary/10 text-primary dark:border-primary/60 dark:bg-primary/20 dark:text-primary-foreground'
							)}
						>
							{popular ? (
								<Flame className='size-3.5 shrink-0 text-orange-500' />
							) : recommended ? (
								<Sparkles className='size-3.5 shrink-0 text-purple-400' />
							) : null}
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='popular'>
								<span className='flex items-center gap-1.5'>
									<Flame className='size-3.5 text-orange-500' />
									{t('menu.popular')}
								</span>
							</SelectItem>
							<SelectItem value='recommended'>
								<span className='flex items-center gap-1.5'>
									<Sparkles className='size-3.5 text-purple-500' />
									{t('menu.recommended')}
								</span>
							</SelectItem>
							<SelectItem value='all'>{t('menu.all_categories')}</SelectItem>
							{categories.map(cat => (
								<SelectItem key={cat.id} value={cat.id}>
									{cat.name ?? cat.key}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	)
}

function CategoryPill({
	label,
	icon: Icon,
	active,
	variant,
	onClick,
}: {
	label: string
	icon?: typeof Flame
	active: boolean
	variant?: 'popular' | 'recommended'
	onClick: () => void
}) {
	const activeClass =
		variant === 'popular'
			? 'border-transparent bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25'
			: variant === 'recommended'
				? 'border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm shadow-purple-500/25'
				: 'border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/20'

	const inactiveClass =
		variant === 'popular'
			? 'border-border/90 bg-background/90 text-foreground/90 hover:border-orange-500/50 hover:bg-orange-500/15 hover:text-orange-500 dark:border-white/20 dark:bg-white/10 dark:hover:border-orange-400/60 dark:hover:bg-orange-500/20 dark:hover:text-orange-300'
			: variant === 'recommended'
				? 'border-border/90 bg-background/90 text-foreground/90 hover:border-purple-500/50 hover:bg-purple-500/15 hover:text-purple-500 dark:border-white/20 dark:bg-white/10 dark:hover:border-purple-400/60 dark:hover:bg-purple-500/20 dark:hover:text-purple-300'
				: 'border-border/90 bg-background/90 text-foreground/90 hover:border-primary/50 hover:bg-primary/15 hover:text-primary dark:border-white/20 dark:bg-white/10 dark:hover:border-primary/60 dark:hover:bg-primary/20 dark:hover:text-primary'

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
