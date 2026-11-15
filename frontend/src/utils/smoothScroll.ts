import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { prefersReducedMotion } from './fireFx'

gsap.registerPlugin(ScrollToPlugin)

let targetY = 0
let isTweening = false

const getMaxScroll = () =>
	Math.max(
		0,
		document.documentElement.scrollHeight -
			document.documentElement.clientHeight
	)

export function syncSmoothScroll() {
	gsap.killTweensOf(window)
	isTweening = false
	targetY = window.scrollY
}

export function smoothScrollTo(y: number, duration = 0.55) {
	if (typeof window === 'undefined') return
	const clamped = gsap.utils.clamp(0, getMaxScroll(), y)
	if (prefersReducedMotion()) {
		syncSmoothScroll()
		window.scrollTo(0, clamped)
		return
	}

	targetY = clamped
	isTweening = true
	gsap.to(window, {
		scrollTo: { y: clamped, autoKill: true },
		duration,
		ease: 'power3.out',
		overwrite: 'auto',
		onAutoKill: () => {
			isTweening = false
			targetY = window.scrollY
		},
		onComplete: () => {
			isTweening = false
			targetY = window.scrollY
		},
	})
}

export function smoothScrollIntoView(
	el: Element | null | undefined,
	block: 'center' | 'nearest' = 'center',
	headerOffset = 72
) {
	if (!el || typeof window === 'undefined') return
	if (prefersReducedMotion()) {
		el.scrollIntoView({ block, behavior: 'auto' })
		syncSmoothScroll()
		return
	}

	const rect = el.getBoundingClientRect()
	const vh = window.innerHeight
	let nextY = window.scrollY

	if (block === 'center') {
		const targetCenter = (vh + headerOffset) / 2
		const elCenter = rect.top + rect.height / 2
		nextY = window.scrollY + (elCenter - targetCenter)
	} else {
		const topLimit = headerOffset + 12
		const bottomLimit = vh - 16
		if (rect.top < topLimit) {
			nextY = window.scrollY + (rect.top - topLimit)
		} else if (rect.bottom > bottomLimit) {
			nextY = window.scrollY + (rect.bottom - bottomLimit)
		} else {
			return
		}
	}

	smoothScrollTo(nextY, 0.6)
}

export function stepWheelScroll(deltaY: number, duration: number) {
	if (!isTweening) {
		targetY = window.scrollY
	}
	const maxScroll = getMaxScroll()
	if (maxScroll <= 0) return false

	const nextY = gsap.utils.clamp(0, maxScroll, targetY + deltaY)
	if (
		Math.abs(nextY - targetY) < 0.5 &&
		Math.abs(window.scrollY - nextY) < 0.5
	) {
		return false
	}

	targetY = nextY
	isTweening = true
	gsap.to(window, {
		scrollTo: { y: targetY, autoKill: false },
		duration,
		ease: 'power3.out',
		overwrite: 'auto',
		onComplete: () => {
			isTweening = false
			targetY = window.scrollY
		},
	})
	return true
}

export function isSmoothTweening() {
	return isTweening
}
