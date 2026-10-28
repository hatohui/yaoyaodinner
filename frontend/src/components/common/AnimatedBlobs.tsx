import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { cn } from '@/utils/shadcn'

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
	border: string
	shapes: string[]
	durationRotate: number
	rotateDirection: 'cw' | 'ccw'
	bounds: { minX: number; maxX: number; minY: number; maxY: number }
	parallaxOffset: { x: number; y: number }
}

const SHAPES_POOL = [
	'60% 40% 30% 70% / 60% 30% 70% 40%',
	'30% 60% 70% 40% / 50% 60% 30% 60%',
	'55% 45% 40% 60% / 65% 35% 55% 45%',
	'40% 60% 60% 40% / 40% 50% 60% 50%',
	'70% 30% 50% 50% / 30% 70% 50% 50%',
	'35% 65% 60% 40% / 65% 35% 40% 60%',
	'50% 50% 20% 80% / 25% 80% 20% 75%',
	'67% 33% 47% 53% / 37% 20% 80% 63%',
	'39% 61% 60% 40% / 52% 48% 52% 48%',
	'58% 42% 33% 67% / 45% 55% 45% 55%',
	'45% 55% 65% 35% / 55% 45% 35% 65%',
	'55% 45% 55% 45% / 45% 55% 45% 55%',
]

const BLOBS: BlobSpec[] = [
	{
		id: 'blob-1',
		sizeStyle: { width: 'min(640px, 52vw)', height: 'min(580px, 48vw)' },
		positionStyle: { top: '-6%', left: '-6%' },
		gradient:
			'radial-gradient(circle at 40% 40%, color-mix(in oklch, var(--primary) 50%, transparent) 0%, color-mix(in oklch, var(--primary) 34%, transparent) 55%, color-mix(in oklch, var(--primary) 15%, transparent) 82%, transparent 100%)',
		border: '1.5px solid color-mix(in oklch, var(--primary) 28%, transparent)',
		shapes: SHAPES_POOL.slice(0, 4),
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
			'radial-gradient(circle at 45% 45%, color-mix(in oklch, var(--chart-2) 46%, transparent) 0%, color-mix(in oklch, var(--chart-2) 30%, transparent) 55%, color-mix(in oklch, var(--chart-2) 14%, transparent) 82%, transparent 100%)',
		border: '1.5px solid color-mix(in oklch, var(--chart-2) 26%, transparent)',
		shapes: SHAPES_POOL.slice(2, 6),
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
			'radial-gradient(circle at 45% 45%, color-mix(in oklch, var(--chart-3) 48%, transparent) 0%, color-mix(in oklch, var(--chart-3) 32%, transparent) 55%, color-mix(in oklch, var(--chart-3) 14%, transparent) 82%, transparent 100%)',
		border: '1.5px solid color-mix(in oklch, var(--chart-3) 26%, transparent)',
		shapes: SHAPES_POOL.slice(4, 8),
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
			'radial-gradient(circle at 50% 40%, color-mix(in oklch, var(--primary) 46%, transparent) 0%, color-mix(in oklch, var(--primary) 30%, transparent) 55%, color-mix(in oklch, var(--primary) 14%, transparent) 82%, transparent 100%)',
		border: '1.5px solid color-mix(in oklch, var(--primary) 26%, transparent)',
		shapes: SHAPES_POOL.slice(6, 10),
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
			'radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--chart-2) 42%, transparent) 0%, color-mix(in oklch, var(--primary) 26%, transparent) 55%, color-mix(in oklch, var(--chart-2) 12%, transparent) 80%, transparent 100%)',
		border: '1.5px solid color-mix(in oklch, var(--chart-2) 24%, transparent)',
		shapes: SHAPES_POOL.slice(8, 12),
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
			'radial-gradient(circle at 45% 45%, color-mix(in oklch, var(--primary) 44%, transparent) 0%, color-mix(in oklch, var(--chart-3) 24%, transparent) 55%, color-mix(in oklch, var(--primary) 10%, transparent) 80%, transparent 100%)',
		border: '1.5px solid color-mix(in oklch, var(--primary) 24%, transparent)',
		shapes: [SHAPES_POOL[1], SHAPES_POOL[5], SHAPES_POOL[9], SHAPES_POOL[11]],
		durationRotate: 36,
		rotateDirection: 'ccw',
		bounds: { minX: -220, maxX: 200, minY: -180, maxY: 180 },
		parallaxOffset: { x: -25, y: 20 },
	},
]

export function AnimatedBlobs({ className }: { className?: string }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const parallaxRefs = useRef<(HTMLDivElement | null)[]>([])

	useGSAP(
		() => {
			const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
			if (reduce) return

			BLOBS.forEach(blob => {
				const driftEl = containerRef.current?.querySelector<HTMLElement>(
					`[data-drift="${blob.id}"]`
				)
				const morphEl = containerRef.current?.querySelector<HTMLElement>(
					`[data-morph="${blob.id}"]`
				)
				if (!driftEl || !morphEl) return

				// Continuous random wandering across 2D plane
				const moveRandomly = () => {
					const nextX = gsap.utils.random(blob.bounds.minX, blob.bounds.maxX, 1)
					const nextY = gsap.utils.random(blob.bounds.minY, blob.bounds.maxY, 1)
					const duration = gsap.utils.random(8, 16)

					gsap.to(driftEl, {
						x: nextX,
						y: nextY,
						duration,
						ease: 'sine.inOut',
						onComplete: moveRandomly,
					})
				}
				moveRandomly()

				// Continuous random breathing scale
				const pulseRandomly = () => {
					const nextScaleX = gsap.utils.random(0.92, 1.14)
					const nextScaleY = gsap.utils.random(0.90, 1.12)
					const duration = gsap.utils.random(5, 9)

					gsap.to(morphEl, {
						scaleX: nextScaleX,
						scaleY: nextScaleY,
						duration,
						ease: 'sine.inOut',
						onComplete: pulseRandomly,
					})
				}
				pulseRandomly()

				// Continuous random organic shape morphing
				let currentShapeIdx = 0
				const morphRandomly = () => {
					currentShapeIdx = (currentShapeIdx + 1) % blob.shapes.length
					const nextShape = blob.shapes[currentShapeIdx]
					const duration = gsap.utils.random(5, 9)

					gsap.to(morphEl, {
						borderRadius: nextShape,
						duration,
						ease: 'sine.inOut',
						onComplete: morphRandomly,
					})
				}
				morphRandomly()

				// Continuous slow rotation
				gsap.to(morphEl, {
					rotation: blob.rotateDirection === 'ccw' ? -360 : 360,
					duration: blob.durationRotate,
					repeat: -1,
					ease: 'none',
				})
			})
		},
		{ scope: containerRef }
	)

	useEffect(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
		if (reduce || !hasHover) return

		const quickSetters = BLOBS.map((_, i) => {
			const el = parallaxRefs.current[i]
			if (!el) return null
			return {
				x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power2.out' }),
				y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power2.out' }),
			}
		})

		const handlePointerMove = (e: PointerEvent) => {
			const nx = (e.clientX / window.innerWidth - 0.5) * 2
			const ny = (e.clientY / window.innerHeight - 0.5) * 2

			BLOBS.forEach((blob, i) => {
				const setter = quickSetters[i]
				if (setter) {
					setter.x(nx * blob.parallaxOffset.x)
					setter.y(ny * blob.parallaxOffset.y)
				}
			})
		}

		const handlePointerLeave = () => {
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
			window.removeEventListener('pointermove', handlePointerMove)
			document.removeEventListener('pointerleave', handlePointerLeave)
		}
	}, [])

	return (
		<div
			ref={containerRef}
			aria-hidden='true'
			className={cn(
				'fixed inset-0 pointer-events-none select-none overflow-hidden -z-20 dark:opacity-75',
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
								borderRadius: blob.shapes[0],
								background: blob.gradient,
								border: blob.border,
								filter: 'blur(16px)',
							}}
							className='will-change-transform'
						/>
					</div>
				</div>
			))}
		</div>
	)
}
