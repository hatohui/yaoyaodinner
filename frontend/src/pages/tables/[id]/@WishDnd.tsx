import { useState, type ReactNode } from 'react'
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import type { TableWishDto, WishKind } from '@/api/model'

interface WishDndProps {
	wishes: TableWishDto[]
	onMove: (id: string, kind: WishKind) => void
	children: ReactNode
}

/** Drag a wish onto another list to change what kind of wish it is. */
export function WishDnd({ wishes, onMove, children }: WishDndProps) {
	const [activeId, setActiveId] = useState<string>()
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 150, tolerance: 6 },
		}),
		useSensor(KeyboardSensor)
	)
	const active = wishes.find(w => w.id === activeId)
	const end = () => setActiveId(undefined)

	return (
		<DndContext
			sensors={sensors}
			onDragStart={e => setActiveId(String(e.active.id))}
			onDragCancel={end}
			onDragEnd={e => {
				const kind = e.over?.id as WishKind | undefined
				const wish = wishes.find(w => w.id === e.active.id)
				if (wish && kind && wish.kind !== kind) onMove(wish.id, kind)
				end()
			}}
		>
			{children}
			<DragOverlay>
				{active && (
					<span className='flex w-fit max-w-72 cursor-grabbing items-center gap-2 rounded-full border border-primary bg-card px-3 py-1.5 text-sm font-semibold text-foreground shadow-lg'>
						<GripVertical className='size-4 shrink-0 text-primary' />
						<span className='truncate'>{active.name}</span>
					</span>
				)}
			</DragOverlay>
		</DndContext>
	)
}

export function useWishDrop(kind: WishKind) {
	const { setNodeRef, isOver, active } = useDroppable({ id: kind })
	return { ref: setNodeRef, isOver, isDragging: Boolean(active) }
}

export function useWishDrag(id: string) {
	const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
		id,
	})
	return {
		ref: setNodeRef,
		handle: { ...attributes, ...listeners },
		isDragging,
	}
}

interface WishDragHandleProps {
	label: string
	handle: ReturnType<typeof useWishDrag>['handle']
}

export function WishDragHandle({ label, handle }: WishDragHandleProps) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			{...handle}
			className='flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary active:cursor-grabbing'
		>
			<GripVertical className='size-4' />
		</button>
	)
}
