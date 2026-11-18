import { useTranslation } from 'react-i18next'
import { Ban, ListPlus, Sparkles, Star, X } from 'lucide-react'
import type { TableWishDto, WishKind } from '@/api/model'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/shadcn'

const KINDS: { kind: WishKind; icon: typeof Star }[] = [
	{ kind: 'must', icon: Star },
	{ kind: 'want', icon: Sparkles },
	{ kind: 'avoid', icon: Ban },
]

interface WishMenuProps {
	name: string
	wish: TableWishDto | undefined
	onPick: (kind: WishKind) => void
	onRemove: () => void
	size?: 'default' | 'lg'
}

/** Opens the plan options (Must order / Want to try / Avoid) for a dish. */
export function WishMenu({
	wish,
	onPick,
	onRemove,
	size = 'default',
}: WishMenuProps) {
	const { t } = useTranslation()
	const current = KINDS.find(k => k.kind === wish?.kind)
	const Icon = current?.icon ?? ListPlus
	const label = current
		? t(`plan_board.${current.kind}`)
		: t('plan_board.add_to_plan')

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					aria-label={label}
					title={label}
					className={cn(
						'flex shrink-0 cursor-pointer items-center justify-center rounded-full border shadow-xs transition-colors',
						size === 'lg' ? 'size-11' : 'size-8',
						current
							? current.kind === 'avoid'
								? 'border-destructive/40 bg-destructive text-primary-foreground hover:opacity-90'
								: 'border-primary/40 bg-primary text-primary-foreground hover:opacity-90'
							: 'border-border bg-control text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
					)}
				>
					<Icon
						className={cn('size-4', current?.kind === 'must' && 'fill-current')}
					/>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-48'>
				<DropdownMenuLabel>{t('plan_board.add_to_plan')}</DropdownMenuLabel>
				{KINDS.map(({ kind, icon: KindIcon }) => (
					<DropdownMenuItem
						key={kind}
						disabled={wish?.kind === kind}
						onSelect={() => onPick(kind)}
						className='gap-2'
					>
						<KindIcon
							className={cn(
								'size-4',
								kind === 'avoid' ? 'text-destructive' : 'text-primary'
							)}
						/>
						{t(`plan_board.${kind}`)}
					</DropdownMenuItem>
				))}
				{current && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={onRemove} className='gap-2'>
							<X className='size-4' />
							{t('plan_board.remove_from_plan')}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
