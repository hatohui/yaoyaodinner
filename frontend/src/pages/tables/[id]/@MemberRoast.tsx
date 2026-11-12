import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flame, RefreshCw } from 'lucide-react'
import type { MemberRoastDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import {
	bump,
	burstFlames,
	canHover,
	startBurning,
	startIdleBumps,
} from '@/utils/fireFx'
import { cn } from '@/utils/shadcn'
import { RoastText } from './@RoastText'

const HOVER_OPEN_MS = 180
const HOVER_CLOSE_MS = 220
const DRAWER_ROOM_PX = 220

let closeActiveDrawer: (() => void) | null = null

interface MemberRoastProps {
	name: string
	roast: MemberRoastDto | undefined
	isRoasting: boolean
	compact: boolean
	showsInline: boolean
	onRoast: () => void
}

export function MemberRoast({
	name,
	roast,
	isRoasting,
	compact,
	showsInline,
	onRoast,
}: MemberRoastProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const [side, setSide] = useState<'top' | 'bottom'>('bottom')
	const buttonRef = useRef<HTMLButtonElement | null>(null)
	const [buttonEl, setButtonEl] = useState<HTMLButtonElement | null>(null)
	const cardRef = useRef<HTMLElement | null>(null)
	const hoverTimer = useRef<number | undefined>(undefined)
	const pinned = useRef(false)
	const contentRef = useRef<HTMLDivElement>(null)
	const wasRoasting = useRef(false)
	const [fresh, setFresh] = useState(false)
	const remaining = roast?.remainingToday ?? 0
	const hasRoast = Boolean(roast?.text)

	const card = () =>
		buttonRef.current?.closest<HTMLElement>('[data-tour="person"]') ?? null

	useEffect(() => {
		cardRef.current =
			buttonEl?.closest<HTMLElement>('[data-tour="person"]') ?? null
		return startIdleBumps(buttonEl, 3000, 9000, 0.5)
	}, [buttonEl])

	useLayoutEffect(() => {
		const el = card()
		if (!el || !open) return
		const rect = el.getBoundingClientRect()
		const next =
			window.innerHeight - rect.bottom < DRAWER_ROOM_PX &&
			rect.top > DRAWER_ROOM_PX
				? 'top'
				: 'bottom'
		setSide(next)
		const corner = next === 'top' ? 'rounded-t-none' : 'rounded-b-none'
		el.classList.add(corner, 'border-fire')
		return () => el.classList.remove(corner, 'border-fire')
	}, [open])

	useEffect(() => {
		if (!open) return
		const close = () => {
			pinned.current = false
			setOpen(false)
		}
		closeActiveDrawer?.()
		closeActiveDrawer = close
		return () => {
			if (closeActiveDrawer === close) closeActiveDrawer = null
		}
	}, [open])

	useEffect(() => {
		const el = card()
		if (!el || !isRoasting) return
		el.classList.add('animate-ember', 'border-fire')
		const stop = startBurning(el)
		return () => {
			stop()
			el.classList.remove('animate-ember', 'border-fire')
		}
	}, [isRoasting])

	useEffect(() => {
		const el = card()
		if (!el || !hasRoast || showsInline || !canHover()) return
		const schedule = (next: boolean, ms: number) => {
			window.clearTimeout(hoverTimer.current)
			hoverTimer.current = window.setTimeout(() => setOpen(next), ms)
		}
		const enter = () => schedule(true, HOVER_OPEN_MS)
		const leave = (event: MouseEvent) => {
			if (contentRef.current?.contains(event.relatedTarget as Node | null)) return
			if (pinned.current) window.clearTimeout(hoverTimer.current)
			else schedule(false, HOVER_CLOSE_MS)
		}
		el.addEventListener('mouseenter', enter)
		el.addEventListener('mouseleave', leave)
		return () => {
			el.removeEventListener('mouseenter', enter)
			el.removeEventListener('mouseleave', leave)
			window.clearTimeout(hoverTimer.current)
		}
	}, [hasRoast, showsInline])

	useEffect(() => {
		if (showsInline) setOpen(false)
	}, [showsInline])

	useEffect(() => {
		if (isRoasting) wasRoasting.current = true
		else if (wasRoasting.current) {
			wasRoasting.current = false
			setFresh(true)
		}
	}, [isRoasting])

	useEffect(() => {
		if (!open) setFresh(false)
	}, [open])

	const roastNow = () => {
		if (remaining === 0 || isRoasting) return
		pinned.current = true
		setOpen(true)
		onRoast()
	}

	return (
		<Popover
			open={open && !showsInline}
			onOpenChange={next => {
				if (!next) pinned.current = false
				setOpen(next && !showsInline)
			}}
		>
			<PopoverAnchor virtualRef={cardRef as React.RefObject<HTMLElement>} />
			<PopoverTrigger asChild>
				<button
					ref={node => {
						buttonRef.current = node
						setButtonEl(node)
					}}
					type='button'
					aria-label={t('roast.member', { name })}
					title={t('roast.member', { name })}
					onMouseEnter={() => bump(buttonRef.current)}
					onClick={event => {
						bump(buttonRef.current, 1.6)
						event.preventDefault()
						const el = card()
						if (el) burstFlames(el, hasRoast ? 6 : 10)
						if (hasRoast && !showsInline) {
							pinned.current = !pinned.current
							setOpen(pinned.current)
						} else roastNow()
					}}
					className={cn(
						'pointer-events-auto relative flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-fire/50 bg-fire/15 text-fire motion-safe:animate-ember',
						compact ? 'size-7' : 'size-8'
					)}
				>
					<Flame
						className={cn(
							'size-4 motion-safe:animate-flame',
							hasRoast ? 'fill-fire/60' : 'fill-fire/25'
						)}
					/>
				</button>
			</PopoverTrigger>
			<PopoverContent
				ref={contentRef}
				side={side}
				align='center'
				sideOffset={-1}
				avoidCollisions={false}
				onMouseEnter={() => window.clearTimeout(hoverTimer.current)}
				onMouseLeave={() => {
					if (!canHover() || pinned.current) return
					window.clearTimeout(hoverTimer.current)
					hoverTimer.current = window.setTimeout(
						() => setOpen(false),
						HOVER_CLOSE_MS
					)
				}}
				onOpenAutoFocus={event => event.preventDefault()}
				onInteractOutside={event => {
					if (card()?.contains(event.target as Node)) event.preventDefault()
				}}
				className={cn(
					'flex w-(--radix-popover-trigger-width) flex-col gap-2 border-fire bg-card px-4 text-sm shadow-lg shadow-fire/20 data-[side=bottom]:slide-in-from-top-0 data-[side=top]:slide-in-from-bottom-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100',
					side === 'top'
						? 'origin-bottom rounded-t-2xl rounded-b-none border-b-0 pt-3 pb-2'
						: 'origin-top rounded-t-none rounded-b-2xl border-t-0 pt-2 pb-3'
				)}
			>
				<div
					aria-hidden
					className={cn(
						'h-px w-full bg-gradient-to-r from-transparent via-fire/70 to-transparent',
						side === 'top' && 'order-last'
					)}
				/>
				{isRoasting ? (
					<p className='flex items-center gap-2 text-muted-foreground'>
						<Spinner className='size-3.5 text-fire' />
						{t('roast.roasting')}
					</p>
				) : hasRoast ? (
					<RoastText text={roast?.text ?? ''} animate={fresh} />
				) : (
					<p className='text-muted-foreground'>
						{t('roast.member_empty', { name })}
					</p>
				)}
				{roast?.isStale && !isRoasting && (
					<p className='text-xs text-muted-foreground'>
						{t('roast.stale_member')}
					</p>
				)}
				<div className='flex items-center justify-between gap-2 pt-1'>
					<span className='text-xs text-muted-foreground'>
						{t('roast.left_today', { count: remaining })}
					</span>
					<Button
						size='sm'
						className='h-7 gap-1.5 rounded-full bg-gradient-to-r from-fire to-fire-glow px-3 text-xs font-semibold text-fire-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50'
						disabled={isRoasting || remaining === 0}
						onClick={roastNow}
					>
						{hasRoast ? (
							<RefreshCw className='size-3.5' />
						) : (
							<Flame className='size-3.5 fill-fire-foreground motion-safe:animate-flame' />
						)}
						{t(hasRoast ? 'roast.again' : 'roast.cta_member')}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}
