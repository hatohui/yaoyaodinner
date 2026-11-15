import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { canHover, prefersReducedMotion } from '@/utils/fireFx'
import {
	isSmoothTweening,
	stepWheelScroll,
	syncSmoothScroll,
} from '@/utils/smoothScroll'

function hasScrollableAncestor(target: EventTarget | null, deltaY: number) {
	let el = target instanceof HTMLElement ? target : null
	while (el && el !== document.body && el !== document.documentElement) {
		const style = window.getComputedStyle(el)
		const overflowY = style.overflowY
		const isScrollable =
			overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'

		if (isScrollable) {
			const overscroll = style.overscrollBehaviorY
			if (overscroll === 'contain' || overscroll === 'none') {
				return true
			}
			if (el.scrollHeight > el.clientHeight + 1) {
				if (deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)
					return true
				if (deltaY < 0 && el.scrollTop > 1) return true
			}
		}
		el = el.parentElement
	}
	return false
}

export function useSmoothScroll() {
	const { pathname } = useLocation()

	useEffect(() => {
		syncSmoothScroll()
	}, [pathname])

	useEffect(() => {
		if (prefersReducedMotion() || !canHover()) return

		const onWheel = (e: WheelEvent) => {
			if (
				e.defaultPrevented ||
				e.ctrlKey ||
				e.metaKey ||
				e.shiftKey ||
				Math.abs(e.deltaX) > Math.abs(e.deltaY)
			) {
				return
			}
			if (document.body.hasAttribute('data-scroll-locked')) return

			let deltaY = e.deltaY
			if (e.deltaMode === 1) deltaY *= 40
			else if (e.deltaMode === 2) deltaY *= window.innerHeight

			if (Math.abs(deltaY) < 1) return
			if (hasScrollableAncestor(e.target, deltaY)) return

			const isTrackpad =
				e.deltaMode === 0 &&
				(!Number.isInteger(e.deltaY) || Math.abs(deltaY) < 40)
			const duration = isTrackpad ? 0.25 : 0.5

			if (stepWheelScroll(deltaY, duration)) {
				e.preventDefault()
			}
		}

		const onScroll = () => {
			if (!isSmoothTweening()) {
				syncSmoothScroll()
			}
		}

		const onUserInterrupt = () => {
			syncSmoothScroll()
		}

		window.addEventListener('wheel', onWheel, { passive: false })
		window.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('touchstart', onUserInterrupt, { passive: true })
		window.addEventListener('mousedown', onUserInterrupt, { passive: true })

		return () => {
			window.removeEventListener('wheel', onWheel)
			window.removeEventListener('scroll', onScroll)
			window.removeEventListener('touchstart', onUserInterrupt)
			window.removeEventListener('mousedown', onUserInterrupt)
			syncSmoothScroll()
		}
	}, [])
}
