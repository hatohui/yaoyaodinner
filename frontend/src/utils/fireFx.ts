import gsap from 'gsap'

const FLAME_CLASS =
	'pointer-events-none absolute z-10 rounded-[50%_50%_45%_45%/65%_65%_35%_35%] bg-gradient-to-t from-ember via-fire to-fire-glow mix-blend-screen'

const FLAME_SOUND_URL = '/assets/sounds/flame.mp3'
const FLAME_VOLUME = 0.6
const FLAME_FADE_SECONDS = 0.6

export const prefersReducedMotion = () =>
	typeof window !== 'undefined' &&
	window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const canHover = () =>
	typeof window !== 'undefined' &&
	window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** Flames rise off the bottom edge of `el`; `el` must be positioned. */
export function burstFlames(el: HTMLElement, count = 10) {
	if (prefersReducedMotion()) return
	const { width, height } = el.getBoundingClientRect()
	for (let i = 0; i < count; i++) {
		const flame = document.createElement('span')
		const size = gsap.utils.random(8, 20)
		flame.className = FLAME_CLASS
		flame.style.width = `${size}px`
		flame.style.height = `${size * 1.4}px`
		flame.style.left = `${gsap.utils.random(4, Math.max(width - 24, 8))}px`
		flame.style.bottom = `${gsap.utils.random(-4, height * 0.25)}px`
		el.appendChild(flame)
		gsap
			.timeline({ onComplete: () => flame.remove() })
			.fromTo(
				flame,
				{
					y: 0,
					x: 0,
					scale: 0.3,
					opacity: 0.95,
					rotate: gsap.utils.random(-20, 20),
				},
				{
					y: -gsap.utils.random(height * 0.6, height * 1.4 + 30),
					x: gsap.utils.random(-18, 18),
					scale: gsap.utils.random(0.9, 1.5),
					rotate: gsap.utils.random(-35, 35),
					duration: gsap.utils.random(0.7, 1.3),
					delay: gsap.utils.random(0, 0.35),
					ease: 'power1.out',
				}
			)
			.to(
				flame,
				{ opacity: 0, scale: 0.2, duration: 0.35, ease: 'power2.in' },
				'-=0.35'
			)
	}
}

export function shake(el: HTMLElement, strength = 4) {
	if (prefersReducedMotion()) return
	gsap.fromTo(
		el,
		{ x: 0, rotate: 0 },
		{
			keyframes: [
				{ x: -strength, rotate: -1 },
				{ x: strength, rotate: 1 },
				{ x: -strength / 2, rotate: -0.5 },
				{ x: strength / 2, rotate: 0.5 },
				{ x: 0, rotate: 0 },
			],
			duration: 0.45,
			ease: 'power1.inOut',
			clearProps: 'transform',
		}
	)
}

function playFlameSound() {
	const sound = new Audio(FLAME_SOUND_URL)
	sound.volume = FLAME_VOLUME
	void sound.play().catch(() => undefined)
	return () => {
		gsap.to(sound, {
			volume: 0,
			duration: FLAME_FADE_SECONDS,
			ease: 'power1.out',
			onComplete: () => sound.pause(),
		})
	}
}

export function bump(el: HTMLElement | null, strength = 1) {
	if (!el || prefersReducedMotion()) return
	gsap.killTweensOf(el)
	gsap
		.timeline({ defaults: { overwrite: 'auto' } })
		.to(el, {
			scale: 1 + 0.18 * strength,
			rotate: gsap.utils.random(-10, 10) * strength,
			duration: 0.12,
			ease: 'power2.out',
		})
		.to(el, {
			scale: 1 - 0.07 * strength,
			rotate: gsap.utils.random(-6, 6) * strength,
			duration: 0.1,
		})
		.to(el, { scale: 1 + 0.05 * strength, rotate: 0, duration: 0.1 })
		.to(el, {
			scale: 1,
			duration: 0.35,
			ease: 'elastic.out(1.2, 0.4)',
			clearProps: 'transform',
		})
}

/** Random small bumps while `el` sits idle, until the returned stop() is called. */
export function startIdleBumps(
	el: HTMLElement | null,
	minMs = 2500,
	maxMs = 6000,
	strength = 0.6
) {
	if (!el || prefersReducedMotion()) return () => undefined
	let timer = 0
	const schedule = () => {
		timer = window.setTimeout(
			() => {
				if (!el.matches(':hover')) bump(el, strength)
				schedule()
			},
			gsap.utils.random(minMs, maxMs)
		)
	}
	schedule()
	return () => window.clearTimeout(timer)
}

/** Keeps `el` shaking, spitting flames and crackling until the returned stop() is called. */
export function startBurning(el: HTMLElement) {
	const stopSound = playFlameSound()
	if (prefersReducedMotion()) return stopSound
	shake(el, 5)
	burstFlames(el, 12)
	const timer = window.setInterval(() => {
		burstFlames(el, 6)
		shake(el, 2)
	}, 450)
	return () => {
		window.clearInterval(timer)
		stopSound()
	}
}

/** Pops each `[data-word]` child of `el` in, slightly rotated, one after another. */
export function popWords(el: HTMLElement) {
	if (prefersReducedMotion()) return
	gsap.fromTo(
		el.querySelectorAll('[data-word]'),
		{ opacity: 0, y: 10, scale: 0.6, rotate: () => gsap.utils.random(-12, 12) },
		{
			opacity: 1,
			y: 0,
			scale: 1,
			rotate: 0,
			duration: 0.35,
			stagger: 0.045,
			ease: 'back.out(3)',
		}
	)
}
