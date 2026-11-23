import { useTranslation } from 'react-i18next'
import { Ban, Sparkles, Star } from 'lucide-react'
import type { WishKind } from '@/api/model'
import type { NewWish } from '@/hooks/useTableWishes'
import { cn } from '@/utils/shadcn'
import { WishAddForm } from './@WishAddForm'

const WISH_KINDS = [
	{ kind: 'must', icon: Star },
	{ kind: 'want', icon: Sparkles },
	{ kind: 'avoid', icon: Ban },
] as const

interface PlanAddBarProps {
	kind: WishKind
	plannedFoodIds: Set<string>
	onKindChange?: (kind: WishKind) => void
	onAdd: (wish: NewWish) => void
	className?: string
}

export function PlanAddBar({
	kind,
	plannedFoodIds,
	onKindChange,
	onAdd,
	className,
}: PlanAddBarProps) {
	const { t } = useTranslation()

	return (
		<div className={cn('flex flex-col gap-2 sm:flex-row', className)}>
			<div className='min-w-0 flex-1'>
				<WishAddForm
					placeholder={t('plan_board.add_to', {
						list: t(`plan_board.${kind}`),
					})}
					plannedFoodIds={plannedFoodIds}
					onAdd={wish => onAdd({ kind, ...wish } as NewWish)}
				/>
			</div>
			{onKindChange && (
				<div
					role='radiogroup'
					aria-label={t('plan_board.add_to_label')}
					className='flex h-9 shrink-0 items-center gap-0.5 self-start rounded-xl border border-border bg-control p-0.5'
				>
					{WISH_KINDS.map(({ kind: value, icon: Icon }) => (
						<button
							key={value}
							type='button'
							role='radio'
							aria-checked={kind === value}
							onClick={() => onKindChange(value)}
							className={cn(
								'flex h-full cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors',
								kind === value
									? value === 'avoid'
										? 'bg-destructive/15 text-destructive'
										: 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'
							)}
						>
							<Icon className='size-3.5' />
							{t(`plan_board.${value}`)}
						</button>
					))}
				</div>
			)}
		</div>
	)
}
