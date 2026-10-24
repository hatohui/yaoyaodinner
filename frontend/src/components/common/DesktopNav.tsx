import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import gsap from 'gsap'
import { cn } from '@/utils/shadcn'

type NavLink = { to: string; label: string; icon: LucideIcon }

type Props = {
	links: NavLink[]
	isActive: (to: string) => boolean
	pendingTo: string | null
	onNavigate: (to: string) => void
}

export function DesktopNav({ links, isActive, pendingTo, onNavigate }: Props) {
	const navRef = useRef<HTMLElement>(null)
	const pillRef = useRef<HTMLSpanElement>(null)
	const shown = useRef(false)
	const target = pendingTo ?? links.find(link => isActive(link.to))?.to

	useLayoutEffect(() => {
		const nav = navRef.current
		const pill = pillRef.current
		if (!nav || !pill) return

		const find = () =>
			target ? nav.querySelector<HTMLElement>(`[data-to="${target}"]`) : null

		const el = find()
		if (!el) {
			gsap.to(pill, { autoAlpha: 0, duration: 0.2 })
			shown.current = false
			return
		}

		const next = { x: el.offsetLeft, width: el.offsetWidth }
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		const tween = shown.current
			? gsap.to(pill, {
					...next,
					duration: reduce ? 0 : 0.35,
					ease: 'power3.out',
					overwrite: true,
				})
			: gsap.set(pill, { ...next, autoAlpha: 1 })
		shown.current = true

		// Labels change width when the language switches; follow without animating.
		let navWidth = nav.offsetWidth
		const observer = new ResizeObserver(() => {
			const current = find()
			if (!current || nav.offsetWidth === navWidth) return
			navWidth = nav.offsetWidth
			tween.kill()
			gsap.set(pill, { x: current.offsetLeft, width: current.offsetWidth })
		})
		observer.observe(nav)

		return () => {
			observer.disconnect()
			tween.kill()
		}
	}, [target])

	return (
		<nav
			ref={navRef}
			className='relative hidden min-w-0 items-center gap-1 sm:flex'
		>
			<span
				ref={pillRef}
				aria-hidden
				className='invisible absolute inset-y-0 left-0 rounded-full bg-primary/12 opacity-0'
			/>
			{links.map(link => (
				<Link
					key={link.to}
					to={link.to}
					data-to={link.to}
					onClick={() => onNavigate(link.to)}
					aria-busy={pendingTo === link.to}
					aria-current={isActive(link.to) ? 'page' : undefined}
					className={cn(
						'relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200',
						target === link.to
							? 'text-primary'
							: 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
					)}
				>
					<link.icon className='size-4 shrink-0' strokeWidth={1.75} />
					{link.label}
				</Link>
			))}
		</nav>
	)
}
