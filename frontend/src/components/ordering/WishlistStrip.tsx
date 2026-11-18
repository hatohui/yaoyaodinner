import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
	ArrowRight,
	Ban,
	Check,
	ChevronDown,
	CircleHelp,
	ListChecks,
	ShoppingCart,
	Sparkles,
	Star,
	TriangleAlert,
	Zap,
} from 'lucide-react'
import type { PersonDto, TableWishDto, WishKind } from '@/api/model'
import type { CartLine } from '@/hooks/useOrderCart'
import { openPlanWishes, type WishStatus } from '@/hooks/useTableWishes'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/utils/shadcn'
import { ApplyPlanDialog, type ApplyPlanSelection } from './ApplyPlanDialog'

const PREVIEW_LIMIT = 4

const KIND_ORDER: Record<WishKind, number> = {
	must: 0,
	want: 1,
	avoid: 2,
}

export interface WishlistAllergy {
	key: string
	label: string
	people: string[]
}

interface WishlistStripProps {
	tableId: string
	wishes: TableWishDto[]
	cartLines?: CartLine[]
	myPersonId?: string | null
	people: PersonDto[]
	allergies?: WishlistAllergy[]
	statusOf: (wish: TableWishDto) => WishStatus
	isApplying?: boolean
	onApply: (selection: ApplyPlanSelection) => Promise<boolean> | boolean | void
	onSelectFood?: (foodId: string) => void
	compact?: boolean
	canApply?: boolean
}

export function WishlistStrip({
	tableId,
	wishes,
	cartLines = [],
	myPersonId = null,
	people,
	allergies,
	statusOf,
	isApplying = false,
	onApply,
	onSelectFood,
	compact,
	canApply = true,
}: WishlistStripProps) {
	const { t } = useTranslation()

	const sorted = [...wishes].sort(
		(a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
	)
	const left = sorted.filter(
		w => w.kind !== 'avoid' && statusOf(w) !== 'ordered'
	).length
	const pending = openPlanWishes(wishes, statusOf)
	const extraCartCount = cartLines.filter(
		l => !pending.some(w => w.foodId === l.foodId)
	).length
	const applyCount = pending.length + extraCartCount
	const [previewing, setPreviewing] = useState(false)
	const [collapsed, setCollapsed] = useState(compact ?? false)
	const [showAll, setShowAll] = useState(false)
	const [legendOpen, setLegendOpen] = useState(false)

	useEffect(() => {
		setCollapsed(Boolean(compact))
	}, [compact])

	const visible = showAll ? sorted : sorted.slice(0, PREVIEW_LIMIT)
	const hiddenCount = sorted.length - visible.length

	const hasApply = canApply && pending.length > 0

	const collapseButton = wishes.length > 0 && (
		<button
			type='button'
			onClick={() => setCollapsed(v => !v)}
			aria-expanded={!collapsed}
			aria-label={t('plan_board.strip_title')}
			className='inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground'
		>
			<ChevronDown
				className={cn(
					'size-4 transition-transform duration-200',
					collapsed ? '-rotate-90' : 'rotate-0'
				)}
			/>
		</button>
	)

	return (
		<section className='flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3'>
			<header className='flex flex-wrap items-center justify-between gap-2'>
				<div className='flex min-w-0 flex-1 items-center gap-1.5 sm:flex-initial'>
					{wishes.length > 0 ? (
						<button
							type='button'
							onClick={() => setCollapsed(v => !v)}
							aria-expanded={!collapsed}
							className='flex min-w-0 cursor-pointer items-center gap-2 text-left'
						>
							<ListChecks className='size-4 shrink-0 text-primary' />
							<h2 className='shrink-0 text-sm font-semibold text-foreground'>
								{t('plan_board.strip_title')}
							</h2>
							<span className='min-w-0 truncate text-xs text-muted-foreground'>
								{left > 0
									? t('plan_board.strip_left', { count: left })
									: t('plan_board.strip_done')}
							</span>
						</button>
					) : (
						<div className='flex min-w-0 items-center gap-2'>
							<ListChecks className='size-4 shrink-0 text-primary' />
							<h2 className='shrink-0 text-sm font-semibold text-foreground'>
								{t('plan_board.strip_title')}
							</h2>
							<span className='min-w-0 truncate text-xs text-muted-foreground'>
								{t('plan_board.strip_empty')}
							</span>
						</div>
					)}
					<Tooltip open={legendOpen} onOpenChange={setLegendOpen}>
						<TooltipTrigger asChild>
							<button
								type='button'
								aria-label={t('plan_board.strip_title')}
								onClick={e => {
									e.stopPropagation()
									setLegendOpen(v => !v)
								}}
								className='inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'
							>
								<CircleHelp className='size-3.5' />
							</button>
						</TooltipTrigger>
						<TooltipContent
							side='bottom'
							className='flex flex-col gap-1.5 p-2.5 text-xs'
						>
							<span className='flex items-center gap-1.5'>
								<Star className='size-3.5 shrink-0 fill-primary text-primary' />
								{t('plan_board.must')}
							</span>
							<span className='flex items-center gap-1.5'>
								<Sparkles className='size-3.5 shrink-0 text-primary' />
								{t('plan_board.want')}
							</span>
							<span className='flex items-center gap-1.5'>
								<Ban className='size-3.5 shrink-0 text-destructive' />
								{t('plan_board.avoid')}
							</span>
							<span className='flex items-center gap-1.5'>
								<Check className='size-3.5 shrink-0 text-primary' />
								{t('plan_board.status_ordered')}
							</span>
							<span className='flex items-center gap-1.5'>
								<ShoppingCart className='size-3.5 shrink-0 text-primary' />
								{t('plan_board.status_in_cart')}
							</span>
						</TooltipContent>
					</Tooltip>
				</div>

				{hasApply && (
					<div className='shrink-0 sm:hidden'>{collapseButton}</div>
				)}

				<div
					className={cn(
						'flex shrink-0 items-center gap-1.5 sm:ml-auto',
						hasApply ? 'w-full justify-between sm:w-auto sm:justify-start' : 'ml-auto'
					)}
				>
					{hasApply && (
						<Button
							size='sm'
							onClick={() => setPreviewing(true)}
							className='h-8 shrink-0 gap-1.5 rounded-xl px-3 text-xs'
						>
							<Zap className='size-3.5' />
							{t('plan_board.apply_plan', { count: applyCount })}
						</Button>
					)}
					<Link
						to={`/tables/${tableId}?tab=plan`}
						className='flex h-8 shrink-0 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10'
					>
						{t('plan_board.open_plan')}
						<ArrowRight className='size-3.5' />
					</Link>
					<div className={cn('shrink-0', hasApply && 'hidden sm:block')}>
						{collapseButton}
					</div>
				</div>
			</header>
			{allergies && allergies.length > 0 && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className='inline-flex w-fit max-w-full cursor-help items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive'>
							<TriangleAlert className='size-3.5 shrink-0' />
							<span className='truncate'>
								{t('plan_board.allergies')}:{' '}
								{allergies.map(a => a.label).join(', ')}
							</span>
						</span>
					</TooltipTrigger>
					<TooltipContent
						side='bottom'
						className='flex flex-col gap-1 p-2.5 text-xs'
					>
						{allergies.map(a => (
							<span key={a.key}>
								<span className='font-semibold'>{a.label}</span>
								{' — '}
								{a.people.join(', ')}
							</span>
						))}
					</TooltipContent>
				</Tooltip>
			)}
			{wishes.length > 0 && !collapsed && (
				<ul className='flex flex-wrap gap-1.5'>
					{visible.map(wish => {
						const status = statusOf(wish)
						const isAvoid = wish.kind === 'avoid'
						const kindLabel = t(`plan_board.${wish.kind}`)
						const statusLabel = !wish.foodId
							? t('plan_board.off_menu')
							: !isAvoid && status === 'ordered'
								? t('plan_board.status_ordered')
								: !isAvoid && status === 'in_cart'
									? t('plan_board.status_in_cart')
									: null
						const tipText = statusLabel
							? `${kindLabel} · ${statusLabel}`
							: kindLabel

						const chipClass = cn(
							'flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs transition-colors',
							isAvoid &&
								'border-destructive/40 bg-destructive/10 text-destructive',
							!isAvoid &&
								status === 'ordered' &&
								'border-transparent bg-primary text-primary-foreground',
							!isAvoid &&
								status === 'in_cart' &&
								'border-primary/40 bg-primary/15 text-primary',
							!isAvoid &&
								status === 'open' &&
								'border-border bg-card text-foreground',
							wish.foodId
								? isAvoid
									? 'cursor-pointer hover:border-destructive/60 hover:bg-destructive/15'
									: status === 'ordered'
										? 'cursor-pointer hover:opacity-90'
										: 'cursor-pointer hover:border-primary/40 hover:bg-primary/10'
								: 'cursor-default'
						)

						const content = (
							<>
								{wish.kind === 'must' && (
									<Star
										className={cn(
											'size-3 shrink-0',
											status === 'ordered'
												? 'fill-current text-current'
												: 'fill-primary text-primary'
										)}
									/>
								)}
								{wish.kind === 'want' && (
									<Sparkles
										className={cn(
											'size-3 shrink-0',
											status === 'ordered' ? 'text-current' : 'text-primary'
										)}
									/>
								)}
								{wish.kind === 'avoid' && (
									<Ban className='size-3 shrink-0 text-destructive' />
								)}
								<span>{wish.name}</span>
								{(wish.quantity ?? 1) > 1 && (
									<span className='font-semibold tabular-nums text-primary'>
										×{wish.quantity}
									</span>
								)}
								{!isAvoid && status === 'ordered' && (
									<Check className='size-3 shrink-0' />
								)}
								{!isAvoid && status === 'in_cart' && (
									<ShoppingCart className='size-3 shrink-0' />
								)}
							</>
						)

						const chip = wish.foodId ? (
							<Link
								to={`/menu/${wish.foodId}`}
								onClick={e => {
									if (!onSelectFood) return
									if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
										return
									e.preventDefault()
									onSelectFood(wish.foodId!)
								}}
								className={chipClass}
							>
								{content}
							</Link>
						) : (
							<span className={chipClass}>{content}</span>
						)

						return (
							<li key={wish.id}>
								<Tooltip>
									<TooltipTrigger asChild>{chip}</TooltipTrigger>
									<TooltipContent>{tipText}</TooltipContent>
								</Tooltip>
							</li>
						)
					})}
					{sorted.length > PREVIEW_LIMIT && (
						<li>
							<button
								type='button'
								onClick={() => setShowAll(v => !v)}
								className='flex cursor-pointer items-center rounded-lg border border-dashed border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20'
							>
								{showAll ? '−' : `+${hiddenCount}`}
							</button>
						</li>
					)}
				</ul>
			)}
			<ApplyPlanDialog
				open={previewing}
				onOpenChange={setPreviewing}
				wishes={wishes}
				cartLines={cartLines}
				myPersonId={myPersonId}
				people={people}
				statusOf={statusOf}
				isSubmitting={isApplying}
				onConfirm={onApply}
			/>
		</section>
	)
}
