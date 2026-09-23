import { useTranslation } from 'react-i18next'
import { ArrowUpDown, Flame, Search, Sparkles } from 'lucide-react'
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
		<div className='sticky top-14 z-20 -mx-4 border-b border-border/40 bg-background/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:py-4'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
					<Input
						placeholder={t('menu.search_placeholder')}
						value={search}
						onChange={e => onSearchChange(e.target.value)}
						className='pl-9 rounded-full border-border/60 bg-muted focus-visible:border-primary focus-visible:ring-primary/20'
					/>
				</div>

				<div className='hidden shrink-0 items-center gap-2 sm:flex'>
					<ArrowUpDown className='h-4 w-4 text-muted-foreground' />
					<Select
						value={sort}
						onValueChange={val => onSortChange(val as MenuSort)}
					>
						<SelectTrigger className='h-9 w-40 rounded-full border-border/60 bg-muted text-sm'>
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
				</div>
			</div>

			<div className='mt-3 hidden flex-wrap gap-2 pt-1 sm:flex'>
				<CategoryPill
					label={t('menu.popular')}
					icon={Flame}
					active={popular}
					onClick={() =>
						onFilterChange({ category: 'all', popular: true, recommended: false })
					}
				/>
				<CategoryPill
					label={t('menu.recommended')}
					icon={Sparkles}
					active={recommended}
					onClick={() =>
						onFilterChange({ category: 'all', popular: false, recommended: true })
					}
				/>
				<CategoryPill
					label={t('menu.all_categories')}
					active={activeCategory === 'all' && !popular && !recommended}
					onClick={() =>
						onFilterChange({ category: 'all', popular: false, recommended: false })
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

			<div className='mt-3 grid grid-cols-2 gap-2 pt-1 sm:hidden'>
				<Select
					value={sort}
					onValueChange={val => onSortChange(val as MenuSort)}
				>
					<SelectTrigger className='h-9 w-full rounded-full border-border/60 bg-muted text-sm'>
						<ArrowUpDown className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
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
							category: val === 'popular' || val === 'recommended' ? 'all' : val,
							popular: val === 'popular',
							recommended: val === 'recommended',
						})
					}
				>
					<SelectTrigger className='h-9 w-full rounded-full border-border/60 bg-muted text-sm'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='popular'>
							<span className='flex items-center gap-1.5'>
								<Flame className='size-3.5' />
								{t('menu.popular')}
							</span>
						</SelectItem>
						<SelectItem value='recommended'>
							<span className='flex items-center gap-1.5'>
								<Sparkles className='size-3.5' />
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
	return (
		<button
			onClick={onClick}
			className={cn(
				'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
				active
					? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
					: 'border border-border/60 bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
			)}
		>
			{Icon && <Icon className='size-3.5' />}
			{label}
		</button>
	)
}
