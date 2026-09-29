import { useCallback, useEffect, useRef, useState } from 'react'
import type { TableDto } from '@/api/model'
import {
	CANVAS_H,
	CANVAS_W,
	isOnMap,
	tableDiameter,
} from '@/components/floor-plan/layout'

const DRAG_THRESHOLD_PX = 4

type DropTarget = 'map' | 'tray' | null

interface DragState {
	id: string
	fromMap: boolean
	radiusX: number
	radiusY: number
	x: number
	y: number
	offsetX: number
	offsetY: number
	startClientX: number
	startClientY: number
	moved: boolean
	target: DropTarget
}

interface Band {
	top: number
	height: number
}

const clamp = (value: number, min = 0, max = 100) =>
	Math.min(max, Math.max(min, value))

const contains = (el: HTMLElement | null, clientX: number, clientY: number) => {
	const rect = el?.getBoundingClientRect()
	return (
		!!rect &&
		clientX >= rect.left &&
		clientX <= rect.right &&
		clientY >= rect.top &&
		clientY <= rect.bottom
	)
}

const pointerPercent = (
	canvas: HTMLElement | null,
	clientX: number,
	clientY: number
) => {
	const rect = canvas?.getBoundingClientRect()
	if (!rect) return null
	return {
		x: ((clientX - rect.left) / rect.width) * 100,
		y: ((clientY - rect.top) / rect.height) * 100,
	}
}

export function useTableDrag(
	tables: TableDto[],
	band: Band,
	onPlace: (id: string, x: number, y: number) => void,
	onRemove: (id: string) => void
) {
	const canvasRef = useRef<HTMLDivElement>(null)
	const viewportRef = useRef<HTMLDivElement>(null)
	const trayRef = useRef<HTMLDivElement>(null)
	const [drag, setDragState] = useState<DragState | null>(null)
	const dragRef = useRef<DragState | null>(null)
	const callbacksRef = useRef({ onPlace, onRemove, band })

	useEffect(() => {
		callbacksRef.current = { onPlace, onRemove, band }
	}, [onPlace, onRemove, band])

	const setDrag = useCallback((next: DragState | null) => {
		dragRef.current = next
		setDragState(next)
	}, [])

	const startDrag = (table: TableDto, e: React.PointerEvent) => {
		if (e.button !== 0) return
		const pointer = pointerPercent(canvasRef.current, e.clientX, e.clientY)
		if (!pointer) return
		e.preventDefault()
		const fromMap = isOnMap(table)
		const radiusX = tableDiameter(table.capacity) / 2
		setDrag({
			id: table.id,
			fromMap,
			radiusX,
			radiusY: (radiusX * CANVAS_W) / CANVAS_H,
			x: fromMap ? table.x : pointer.x,
			y: fromMap ? table.y : pointer.y,
			offsetX: fromMap ? pointer.x - table.x : 0,
			offsetY: fromMap ? pointer.y - table.y : 0,
			startClientX: e.clientX,
			startClientY: e.clientY,
			moved: false,
			target: null,
		})
	}

	const dragging = drag !== null

	useEffect(() => {
		if (!dragging) return

		const handleMove = (e: PointerEvent) => {
			const current = dragRef.current
			const pointer = pointerPercent(canvasRef.current, e.clientX, e.clientY)
			if (!current || !pointer) return
			const { band } = callbacksRef.current
			const target: DropTarget = contains(
				viewportRef.current,
				e.clientX,
				e.clientY
			)
				? 'map'
				: contains(trayRef.current, e.clientX, e.clientY)
					? 'tray'
					: null
			setDrag({
				...current,
				x: clamp(
					pointer.x - current.offsetX,
					current.radiusX,
					100 - current.radiusX
				),
				y: clamp(
					pointer.y - current.offsetY,
					(band.top / CANVAS_H) * 100 + current.radiusY,
					((band.top + band.height) / CANVAS_H) * 100 - current.radiusY
				),
				moved:
					current.moved ||
					Math.hypot(
						e.clientX - current.startClientX,
						e.clientY - current.startClientY
					) > DRAG_THRESHOLD_PX,
				target,
			})
		}

		const handleUp = () => {
			const current = dragRef.current
			const { onPlace, onRemove } = callbacksRef.current
			if (current?.moved && current.target === 'map') {
				onPlace(current.id, current.x, current.y)
			}
			if (current?.moved && current.target === 'tray' && current.fromMap) {
				onRemove(current.id)
			}
			setDrag(null)
		}

		const handleCancel = () => setDrag(null)

		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') handleCancel()
		}

		window.addEventListener('pointermove', handleMove)
		window.addEventListener('pointerup', handleUp)
		window.addEventListener('pointercancel', handleCancel)
		window.addEventListener('keydown', handleKey)
		return () => {
			window.removeEventListener('pointermove', handleMove)
			window.removeEventListener('pointerup', handleUp)
			window.removeEventListener('pointercancel', handleCancel)
			window.removeEventListener('keydown', handleKey)
		}
	}, [dragging, setDrag])

	const onMap = drag?.moved && drag.target === 'map' ? drag : null
	const toTray = drag?.moved && drag.target === 'tray' && drag.fromMap

	const placed = tables
		.map(table =>
			table.id === onMap?.id ? { ...table, x: onMap.x, y: onMap.y } : table
		)
		.filter(table => isOnMap(table) && !(toTray && table.id === drag?.id))

	const unplaced = tables.filter(
		table =>
			(!isOnMap(table) && table.id !== onMap?.id) ||
			(toTray && table.id === drag?.id)
	)

	return {
		canvasRef,
		viewportRef,
		trayRef,
		placed,
		unplaced,
		draggingId: drag?.id ?? null,
		draggingFromMap: !!drag?.moved && drag.fromMap,
		overTray: drag?.target === 'tray',
		startDrag,
	}
}
