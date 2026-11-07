import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/shadcn'

const PAD = 6
const GAP = 12
const EDGE = 12
const ROOM = 200
const MAX_WIDTH = 352

interface Hole {
	x: number
	y: number
	w: number
	h: number
	r: number
}

const toHole = (rect: DOMRect): Hole => ({
	x: rect.left - PAD,
	y: rect.top - PAD,
	w: rect.width + PAD * 2,
	h: rect.height + PAD * 2,
	r: Math.min(rect.height / 2, 18) + PAD,
})

const roundedRect = ({ x, y, w, h, r }: Hole) =>
	`M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - 2 * r}a${r},${r} 0 0 1 -${r},-${r}v-${h - 2 * r}a${r},${r} 0 0 1 ${r},-${r}z`

function useViewport() {
	const [size, setSize] = useState(() => ({
		w: window.innerWidth,
		h: window.innerHeight,
	}))
	useEffect(() => {
		const onResize = () =>
			setSize({ w: window.innerWidth, h: window.innerHeight })
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [])
	return size
}

function bubblePosition(anchor: DOMRect | undefined, vw: number, vh: number) {
	const width = Math.min(MAX_WIDTH, vw - EDGE * 2)
	if (!anchor) {
		return { width, left: (vw - width) / 2, top: vh / 2 - 80 }
	}
	const left = Math.min(
		Math.max(anchor.left + anchor.width / 2 - width / 2, EDGE),
		vw - width - EDGE
	)
	if (vh - anchor.bottom >= ROOM) {
		return { width, left, top: anchor.bottom + PAD + GAP }
	}
	if (anchor.top >= ROOM) {
		return { width, left, bottom: vh - anchor.top + PAD + GAP }
	}
	return { width, left, bottom: EDGE + 4 }
}

interface TourSpotlightProps {
	stepKey: string
	rects: DOMRect[]
	children: ReactNode
}

/** Dims the page except for cut-outs around the targets, which stay tappable. */
export function TourSpotlight({
	stepKey,
	rects,
	children,
}: TourSpotlightProps) {
	const { w, h } = useViewport()
	const holes = rects.map(toHole)
	const scrim = `M0,0H${w}V${h}H0z${holes.map(roundedRect).join('')}`
	const position = bubblePosition(rects[0], w, h)

	return createPortal(
		<div className='pointer-events-none fixed inset-0 z-[60]'>
			<svg
				className='absolute inset-0 size-full animate-in fade-in-0 duration-300'
				aria-hidden
			>
				<path
					d={scrim}
					fillRule='evenodd'
					className='pointer-events-auto fill-scrim'
				/>
			</svg>

			{holes.map((hole, i) => (
				<span
					key={i}
					className='absolute ring-2 ring-primary'
					style={{
						left: hole.x,
						top: hole.y,
						width: hole.w,
						height: hole.h,
						borderRadius: hole.r,
					}}
				>
					{i === 0 && (
						<span className='absolute -inset-1 rounded-[inherit] ring-4 ring-primary/60 motion-safe:animate-pulse' />
					)}
				</span>
			))}

			<div
				key={stepKey}
				aria-live='polite'
				className={cn(
					'pointer-events-auto absolute flex flex-col gap-3 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl',
					'animate-in fade-in-0 zoom-in-95 duration-200'
				)}
				style={position}
			>
				{children}
			</div>
		</div>,
		document.body
	)
}
