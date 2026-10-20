import type { CategoryItemDto } from '@/api/model'
import { cn } from '@/utils/shadcn'

interface CategoryChipsProps {
	categories: CategoryItemDto[]
	value: string | undefined
	onChange: (id: string) => void
	allLabel?: string
	className?: string
}

export function CategoryChips({
	categories,
	value,
	onChange,
	allLabel,
	className,
}: CategoryChipsProps) {
	const options = allLabel
		? [{ id: 'all', name: allLabel }, ...categories]
		: categories

	return (
		<div role='radiogroup' className={cn('flex flex-wrap gap-1.5', className)}>
			{options.map(option => (
				<button
					key={option.id}
					type='button'
					role='radio'
					aria-checked={value === option.id}
					onClick={() => onChange(option.id)}
					className={cn(
						'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
						value === option.id
							? 'bg-primary text-primary-foreground shadow-sm'
							: 'border border-border bg-control text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
					)}
				>
					{option.name}
				</button>
			))}
		</div>
	)
}
