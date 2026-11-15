import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { cn } from '@/utils/shadcn'

gsap.registerPlugin(useGSAP)

interface BlobSpec {
	id: string
	sizeStyle: { width: string; height: string }
	positionStyle: {
		top?: string
		bottom?: string
		left?: string
		right?: string
	}
	gradient: string
	shape: string
	durationRotate: number
	rotateDirection: 'cw' | 'ccw'
	bounds: { minX: number; maxX: number; minY: number; maxY: number }
	parallaxOffset: { x: number; y: number }
}

const BLOBS: BlobSpec[] = [
	{
		id: 'blob-1',
		sizeStyle: { width: 'min(640px, 52vw)', height: 'min(580px, 48vw)' },
		positionStyle: { top: '-6%', left: '-6%' },
		gradient:
			'radial-gradient(closest-side at 42% 42%, color-mix(in oklch, var(--primary) 46%, transparent) 0%, color-mix(in oklch, var(--primary) 26%, transparent) 52%, color-mix(in oklch, var(--primary) 8%, transparent) 78%, transparent 100%)',
		shape: '60% 40% 30% 70% / 60% 30% 70% 40%',
		durationRotate: 42,
		rotateDirection: 'cw',
		bounds: { minX: -50, maxX: 260, minY: -40, maxY: 220 },
		parallaxOffset: { x: 35, y: 30 },
	},
	{
		id: 'blob-2',
		sizeStyle: { width: 'min(600px, 48vw)', height: 'min(540px, 44vw)' },
		positionStyle: { top: '6%', right: '-6%' },
		gradient:
			'radial-gradient(closest-side at 45% 45%, color-mix(in oklch, var(--chart-2) 42%, transparent) 0%, color-mix(in oklch, var(--chart-2) 24%, transparent) 52%, color-mix(in oklch, var(--chart-2) 7%, transparent) 78%, transparent 100%)',
		shape: '55% 45% 40% 60% / 65% 35% 55% 45%',
		durationRotate: 48,
		rotateDirection: 'ccw',
		bounds: { minX: -260, maxX: 50, minY: -30, maxY: 240 },
		parallaxOffset: { x: -30, y: 35 },
	},
	{
		id: 'blob-3',
		sizeStyle: { width: 'min(560px, 46vw)', height: 'min(520px, 42vw)' },
		positionStyle: { bottom: '4%', left: '-4%' },
		gradient:
			'radial-gradient(closest-side at 45% 45%, color-mix(in oklch, var(--chart-3) 44%, transparent) 0%, color-mix(in oklch, var(--chart-3) 25%, transparent) 52%, color-mix(in oklch, var(--chart-3) 8%, transparent) 78%, transparent 100%)',
		shape: '70% 30% 50% 50% / 30% 70% 50% 50%',
		durationRotate: 38,
		rotateDirection: 'cw',
		bounds: { minX: -40, maxX: 260, minY: -240, maxY: 40 },
		parallaxOffset: { x: 30, y: -25 },
	},
	{
		id: 'blob-4',
		sizeStyle: { width: 'min(620px, 50vw)', height: 'min(560px, 46vw)' },
		positionStyle: { bottom: '-6%', right: '-4%' },
		gradient:
			'radial-gradient(closest-side at 50% 42%, color-mix(in oklch, var(--primary) 42%, transparent) 0%, color-mix(in oklch, var(--primary) 24%, transparent) 52%, color-mix(in oklch, var(--primary) 7%, transparent) 78%, transparent 100%)',
		shape: '50% 50% 30% 70% / 35% 70% 30% 65%',
		durationRotate: 44,
		rotateDirection: 'ccw',
		bounds: { minX: -260, maxX: 40, minY: -240, maxY: 40 },
		parallaxOffset: { x: -35, y: -30 },
	},
	{
		id: 'blob-5',
		sizeStyle: { width: 'min(480px, 40vw)', height: 'min(440px, 36vw)' },
		positionStyle: { top: '28%', left: '26%' },
		gradient:
			'radial-gradient(closest-side at 50% 50%, color-mix(in oklch, var(--chart-2) 38%, transparent) 0%, color-mix(in oklch, var(--primary) 20%, transparent) 52%, color-mix(in oklch, var(--chart-2) 6%, transparent) 76%, transparent 100%)',
		shape: '39% 61% 60% 40% / 52% 48% 52% 48%',
		durationRotate: 34,
		rotateDirection: 'cw',
		bounds: { minX: -200, maxX: 220, minY: -180, maxY: 180 },
		parallaxOffset: { x: 25, y: -20 },
	},
	{
		id: 'blob-6',
		sizeStyle: { width: 'min(460px, 38vw)', height: 'min(420px, 34vw)' },
		positionStyle: { top: '48%', right: '22%' },
		gradient:
			'radial-gradient(closest-side at 45% 45%, color-mix(in oklch, var(--primary) 40%, transparent) 0%, color-mix(in oklch, var(--chart-3) 20%, transparent) 52%, color-mix(in oklch, var(--primary) 6%, transparent) 76%, transparent 100%)',
		shape: '35% 65% 60% 40% / 65% 35% 40% 60%',
		durationRotate: 36,
		rotateDirection: 'ccw',
		bounds: { minX: -220, maxX: 200, minY: -180, maxY: 180 },
		parallaxOffset: { x: -25, y: 20 },
	},
]

export default function AnimatedBlobs({ className }: { className?: string }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const parallaxRefs = useRef<(HTMLDivElement | null)[]>([])

	useGSAP(
		() => {
			const reduce = window.matchMedia(
				'(prefers-reduced-motion: reduce)'
			).matches
			if (reduce) return

			const tweens: gsap.core.Tween[] = []

			BLOBS.forEach(blob => {
				const driftEl = containerRef.current?.querySelector<HTMLElement>(
					`[data-drift="${blob.id}"]`
				)
				const morphEl = containerRef.current?.querySelector<HTMLElement>(
					`[data-morph="${blob.id}"]`
				)
				if (!driftEl || !morphEl) return

				// Transform-only wandering and scale/rotation so the GPU caches each
				// blob texture once and composites without per-frame paint/blur work.
				const moveRandomly = () => {
					const nextX = gsap.utils.random(blob.bounds.minX, blob.bounds.maxX, 1)
					const nextY = gsap.utils.random(blob.bounds.minY, blob.bounds.maxY, 1)
					const duration = gsap.utils.random(10, 18)

					tweens.push(
						gsap.to(driftEl, {
							x: nextX,
							y: nextY,
							duration,
							ease: 'sine.inOut',
							force3D: true,
							overwrite: 'auto',
							onComplete: moveRandomly,
						})
					)
				}
				moveRandomly()

				const pulseRandomly = () => {
					const nextScaleX = gsap.utils.random(0.88, 1.16)
					const nextScaleY = gsap.utils.random(0.86, 1.14)
					const duration = gsap.utils.random(6, 11)

					tweens.push(
						gsap.to(morphEl, {
							scaleX: nextScaleX,
							scaleY: nextScaleY,
							duration,
							ease: 'sine.inOut',
							force3D: true,
							overwrite: 'auto',
							onComplete: pulseRandomly,
						})
					)
				}
				pulseRandomly()

				tweens.push(
					gsap.to(morphEl, {
						rotation: blob.rotateDirection === 'ccw' ? -360 : 360,
						duration: blob.durationRotate,
						repeat: -1,
						ease: 'none',
						force3D: true,
					})
				)
			})

			const onVisibilityChange = () => {
				const paused = document.visibilityState === 'hidden'
				for (const t of tweens) {
					if (t.isActive()) t.paused(paused)
				}
			}
			document.addEventListener('visibilitychange', onVisibilityChange)
			return () => {
				document.removeEventListener('visibilitychange', onVisibilityChange)
			}
		},
		{ scope: containerRef }
	)

	useEffect(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		const hasHover = window.matchMedia(
			'(hover: hover) and (pointer: fine)'
		).matches
		if (reduce || !hasHover) return

		const quickSetters = BLOBS.map((_, i) => {
			const el = parallaxRefs.current[i]
			if (!el) return null
			return {
				x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power2.out' }),
				y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power2.out' }),
			}
		})

		let rafId = 0
		let lastX = 0
		let lastY = 0

		const flushPointer = () => {
			rafId = 0
			const nx = (lastX / window.innerWidth - 0.5) * 2
			const ny = (lastY / window.innerHeight - 0.5) * 2

			BLOBS.forEach((blob, i) => {
				const setter = quickSetters[i]
				if (setter) {
					setter.x(nx * blob.parallaxOffset.x)
					setter.y(ny * blob.parallaxOffset.y)
				}
			})
		}

		const handlePointerMove = (e: PointerEvent) => {
			lastX = e.clientX
			lastY = e.clientY
			if (!rafId) {
				rafId = requestAnimationFrame(flushPointer)
			}
		}

		const handlePointerLeave = () => {
			if (rafId) {
				cancelAnimationFrame(rafId)
				rafId = 0
			}
			quickSetters.forEach(setter => {
				if (setter) {
					setter.x(0)
					setter.y(0)
				}
			})
		}

		window.addEventListener('pointermove', handlePointerMove, { passive: true })
		document.addEventListener('pointerleave', handlePointerLeave)

		return () => {
			if (rafId) cancelAnimationFrame(rafId)
			window.removeEventListener('pointermove', handlePointerMove)
			document.removeEventListener('pointerleave', handlePointerLeave)
		}
	}, [])

	return (
		<div
			ref={containerRef}
			aria-hidden='true'
			className={cn(
				'fixed inset-0 pointer-events-none select-none overflow-hidden contain-strict -z-20 opacity-70 dark:opacity-55',
				className
			)}
		>
			{BLOBS.map((blob, index) => (
				<div
					key={blob.id}
					ref={el => {
						parallaxRefs.current[index] = el
					}}
					style={blob.positionStyle}
					className='absolute will-change-transform'
				>
					<div data-drift={blob.id} className='will-change-transform'>
						<div
							data-morph={blob.id}
							style={{
								...blob.sizeStyle,
								borderRadius: blob.shape,
								background: blob.gradient,
							}}
							className='will-change-transform'
						/>
					</div>
				</div>
			))}
		</div>
	)
}
