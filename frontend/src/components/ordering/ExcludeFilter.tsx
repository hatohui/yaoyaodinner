import { useTranslation } from 'react-i18next'
import { Ban, ShieldAlert } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import type { ExcludeFilterState } from '@/hooks/useExcludeFilter'
import { cn } from '@/utils/shadcn'

interface ExcludeFilterProps {
	filter: ExcludeFilterState
	align?: 'start' | 'end'
	className?: string
}

export function ExcludeFilter({
	filter,
	align = 'end',
	className,
}: ExcludeFilterProps) {
	const { t } = useTranslation()
	const { shortcut } = filter
	const active = filter.activeCount > 0
	const allergensLabel = (shortcut?.allergens ?? [])
		.map(a => t(`plan_board.allergen.${a}`))
		.join(', ')
	const shortcutApplied =
		Boolean(shortcut?.categoryIds.length) &&
		shortcut!.categoryIds.every(id => filter.categories.includes(id))

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type='button'
					className={cn(
						'flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold shadow-xs transition-colors',
						active
							? 'border-primary/60 bg-primary/10 text-primary'
							: 'border-border bg-card text-foreground hover:border-primary/40 dark:border-white/20 dark:bg-white/10',
						className
					)}
				>
					<Ban className='size-3.5 shrink-0' />
					{t('exclude.button')}
					{active && (
						<span className='rounded-full bg-primary px-1.5 text-xs tabular-nums text-primary-foreground'>
							{filter.activeCount}
						</span>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent align={align} className='flex w-72 flex-col gap-3 p-3'>
				<div className='flex items-center justify-between'>
					<span className='text-sm font-semibold text-foreground'>
						{t('exclude.title')}
					</span>
					{filter.categories.length > 0 && (
						<button
							type='button'
							onClick={filter.clear}
							className='cursor-pointer text-xs text-muted-foreground hover:text-destructive'
						>
							{t('exclude.clear')}
						</button>
					)}
				</div>

				{shortcut && (
					<div className='flex flex-col gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5'>
						<span className='flex items-center gap-1.5 text-xs font-semibold text-foreground'>
							<ShieldAlert className='size-3.5 text-destructive' />
							{t('exclude.table_allergies', { list: allergensLabel })}
						</span>
						{shortcut.categoryIds.length > 0 && (
							<button
								type='button'
								disabled={shortcutApplied}
								onClick={() =>
									filter.setCategories([
										...filter.categories,
										...shortcut.categoryIds,
									])
								}
								className='w-fit cursor-pointer rounded-full border border-destructive/50 bg-card px-3 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:cursor-default disabled:opacity-60'
							>
								{shortcutApplied
									? t('exclude.allergies_applied')
									: t('exclude.avoid_allergies')}
							</button>
						)}
						{shortcut.unmatched.length > 0 && (
							<span className='text-[11px] text-muted-foreground'>
								{t('exclude.unmatched', {
									list: shortcut.unmatched
										.map(a => t(`plan_board.allergen.${a}`))
										.join(', '),
								})}
							</span>
						)}
					</div>
				)}

				{filter.avoidedCount > 0 && (
					<label className='flex cursor-pointer items-center justify-between gap-3 text-sm text-foreground'>
						<span>
							{t('exclude.hide_avoided', { count: filter.avoidedCount })}
						</span>
						<Switch
							checked={filter.hideAvoided}
							onCheckedChange={filter.setHideAvoided}
						/>
					</label>
				)}

				<div className='scrollbar-thin flex max-h-64 flex-col gap-0.5 overflow-y-auto'>
					{filter.allCategories.map(cat => (
						<label
							key={cat.id}
							className='flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm text-foreground hover:bg-primary/10'
						>
							<Checkbox
								checked={filter.categories.includes(cat.id)}
								onCheckedChange={() => filter.toggleCategory(cat.id)}
							/>
							{cat.name ?? cat.key}
						</label>
					))}
				</div>
			</PopoverContent>
		</Popover>
	)
}
