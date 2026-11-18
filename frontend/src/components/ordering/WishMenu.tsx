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
	readOnly?: boolean
}

const TRIGGER =
	'flex size-8 cursor-pointer items-center justify-center rounded-full border shadow backdrop-blur-sm transition-colors'

const CHIP_CLASS: Record<WishKind, string> = {
	must: 'inline-flex h-7 items-center gap-1 rounded-full border border-primary/40 bg-primary px-2.5 text-xs font-semibold text-primary-foreground shadow backdrop-blur-sm transition-opacity',
	want: 'inline-flex h-7 items-center gap-1 rounded-full border border-primary/40 bg-card/95 px-2.5 text-xs font-semibold text-primary shadow backdrop-blur-sm transition-colors',
	avoid:
		'inline-flex h-7 items-center gap-1 rounded-full border border-destructive/40 bg-destructive px-2.5 text-xs font-semibold text-primary-foreground shadow backdrop-blur-sm transition-opacity',
}

/** Opens the plan options (Must order / Want to try / Avoid) for a dish. */
export function WishMenu({
	wish,
	onPick,
	onRemove,
	readOnly = false,
}: WishMenuProps) {
	const { t } = useTranslation()
	const current = KINDS.find(k => k.kind === wish?.kind)
	const Icon = current?.icon ?? ListPlus
	const label = current
		? t(`plan_board.${current.kind}`)
		: t('plan_board.add_to_plan')

	if (!current && readOnly) return null

	const chipIcon = (
		<Icon
			className={cn(
				'shrink-0',
				current ? 'size-3.5' : 'size-4',
				current?.kind === 'must' && 'fill-current'
			)}
		/>
	)

	if (readOnly && current) {
		return (
			<span title={label} className={CHIP_CLASS[current.kind]}>
				{chipIcon}
				<span>{label}</span>
			</span>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					aria-label={label}
					title={label}
					className={cn(
						current
							? cn(CHIP_CLASS[current.kind], 'cursor-pointer hover:opacity-90')
							: cn(
									TRIGGER,
									'border-border/80 bg-card/90 text-foreground hover:border-primary/60 hover:text-primary'
								)
					)}
				>
					{chipIcon}
					{current && <span>{label}</span>}
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
