import { Fragment, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/shadcn'

type NavLink = { to: string; label: string; icon: LucideIcon }

type Props = {
	links: NavLink[]
	isLoading?: boolean
	isActive: (to: string) => boolean
	pendingTo: string | null
	onNavigate: (to: string) => void
}

export function DesktopNav({
	links,
	isLoading,
	isActive,
	pendingTo,
	onNavigate,
}: Props) {
	const navRef = useRef<HTMLElement>(null)
	const pillRef = useRef<HTMLSpanElement>(null)
	const shown = useRef<{ x: number; width: number } | null>(null)
	const target = pendingTo ?? links.find(link => isActive(link.to))?.to

	useLayoutEffect(() => {
		const nav = navRef.current
		const pill = pillRef.current
		if (!nav || !pill) return

		const find = () =>
			target ? nav.querySelector<HTMLElement>(`[data-to="${target}"]`) : null

		const place = (x: number, width: number) => {
			pill.style.width = `${width}px`
			pill.style.transform = `translateX(${x}px)`
		}

		const el = find()
		if (!el) {
			pill.style.opacity = '0'
			shown.current = null
			return
		}

		const next = { x: el.offsetLeft, width: el.offsetWidth }
		const prev = shown.current
		place(next.x, next.width)
		pill.style.opacity = '1'
		shown.current = next

		// Transform-only (FLIP) so the compositor runs it: the incoming page's
		// first render blocks the main thread and would stall a JS tween.
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		const animation =
			prev && !reduce
				? pill.animate(
						[
							{
								transform: `translateX(${prev.x}px) scaleX(${prev.width / next.width})`,
							},
							{ transform: `translateX(${next.x}px) scaleX(1)` },
						],
						{ duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
					)
				: null

		// Labels change width when the language switches; follow without animating.
		let navWidth = nav.offsetWidth
		const observer = new ResizeObserver(() => {
			const current = find()
			if (!current || nav.offsetWidth === navWidth) return
			navWidth = nav.offsetWidth
			animation?.cancel()
			shown.current = { x: current.offsetLeft, width: current.offsetWidth }
			place(shown.current.x, shown.current.width)
		})
		observer.observe(nav)

		return () => {
			observer.disconnect()
			animation?.cancel()
		}
	}, [target, isLoading, links.length])

	return (
		<nav
			ref={navRef}
			aria-busy={isLoading}
			className='relative hidden min-w-0 items-center gap-1 lg:flex'
		>
			<span
				ref={pillRef}
				aria-hidden
				className='absolute inset-y-0 left-0 origin-left rounded-full border border-primary/25 bg-primary/18 opacity-0 shadow-2xs transition-opacity duration-200 will-change-transform'
			/>
			{links.map(link => (
				<Fragment key={link.to}>
					<Link
						to={link.to}
						data-to={link.to}
						onClick={() => onNavigate(link.to)}
						aria-busy={pendingTo === link.to}
						aria-current={isActive(link.to) ? 'page' : undefined}
						className={cn(
							'relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200',
							target === link.to
								? 'font-semibold text-primary'
								: 'text-foreground/75 hover:bg-primary/10 hover:text-primary dark:hover:bg-accent/50'
						)}
					>
						<link.icon className='size-4 shrink-0' strokeWidth={1.75} />
						{link.label}
					</Link>
					{isLoading && link.to === '/about' && (
						<Skeleton className='h-8 w-24 rounded-full' />
					)}
				</Fragment>
			))}
		</nav>
	)
}
