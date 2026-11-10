import { useEffect } from 'react'

const EDGE_PX = 96
const MAX_SPEED_PX = 24

/** Scrolls the window while a native drag hovers near the top or bottom edge. */
export function useDragAutoScroll(active: boolean) {
	useEffect(() => {
		if (!active) return
		let pointerY: number | null = null
		let frame = 0

		const onDragOver = (e: DragEvent) => {
			pointerY = e.clientY
		}

		const tick = () => {
			if (pointerY !== null) {
				const fromTop = pointerY
				const fromBottom = window.innerHeight - pointerY
				if (fromTop < EDGE_PX)
					window.scrollBy(0, -MAX_SPEED_PX * (1 - fromTop / EDGE_PX))
				else if (fromBottom < EDGE_PX)
					window.scrollBy(0, MAX_SPEED_PX * (1 - fromBottom / EDGE_PX))
			}
			frame = requestAnimationFrame(tick)
		}

		document.addEventListener('dragover', onDragOver)
		frame = requestAnimationFrame(tick)
		return () => {
			document.removeEventListener('dragover', onDragOver)
			cancelAnimationFrame(frame)
		}
	}, [active])
}
