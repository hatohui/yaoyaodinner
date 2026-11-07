import { useEffect, useState } from 'react'
import { useAsRef } from '@/hooks/use-as-ref'

export interface TourStep {
	key: string
	targets: Element[]
}

export interface TourFrame {
	key: string | null
	rects: DOMRect[]
}

const OPEN_DIALOG =
	'[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'

const sameFrame = (a: TourFrame, b: TourFrame) =>
	a.key === b.key &&
	a.rects.length === b.rects.length &&
	a.rects.every(
		(r, i) =>
			r.top === b.rects[i].top &&
			r.left === b.rects[i].left &&
			r.width === b.rects[i].width &&
			r.height === b.rects[i].height
	)

/**
 * Targets come and go as data loads and routes change, so the step is
 * re-resolved from the DOM every frame instead of being pushed by components.
 */
export function useTourFrame(resolve: (() => TourStep | null) | null) {
	const [frame, setFrame] = useState<TourFrame>({ key: null, rects: [] })
	const resolveRef = useAsRef(resolve)
	const active = resolve !== null

	useEffect(() => {
		if (!active) {
			setFrame({ key: null, rects: [] })
			return
		}
		let raf = 0
		let last: TourFrame = { key: null, rects: [] }
		let scrolledFor: string | null = null

		const tick = () => {
			const step = document.querySelector(OPEN_DIALOG)
				? null
				: (resolveRef.current?.() ?? null)
			const next: TourFrame = step
				? {
						key: step.key,
						rects: step.targets.map(el => el.getBoundingClientRect()),
					}
				: { key: null, rects: [] }

			if (step && step.key !== scrolledFor && step.targets[0]) {
				scrolledFor = step.key
				step.targets[0].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
			}
			if (!sameFrame(last, next)) {
				last = next
				setFrame(next)
			}
			raf = requestAnimationFrame(tick)
		}

		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
	}, [active, resolveRef])

	return frame
}
