import { useState, type ReactNode } from 'react'
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	pointerWithin,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import type { TableWishDto, WishKind } from '@/api/model'

interface WishDndProps {
	wishes: TableWishDto[]
	onMove: (id: string, kind: WishKind, position?: number) => void
	children: ReactNode
}

/** Drag a wish to reorder priority within a list or move it to another category. */
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
			collisionDetection={pointerWithin}
			onDragStart={e => setActiveId(String(e.active.id))}
			onDragCancel={end}
			onDragEnd={e => {
				const overId = e.over ? String(e.over.id) : null
				const wish = wishes.find(w => w.id === e.active.id)
				if (wish && overId?.startsWith('row:')) {
					const target = wishes.find(w => w.id === overId.slice(4))
					if (target && target.id !== wish.id) {
						const inKind = wishes.filter(w => w.kind === target.kind)
						const targetIndex = inKind.findIndex(w => w.id === target.id)
						const activeIndex = inKind.findIndex(w => w.id === wish.id)
						if (
							targetIndex !== -1 &&
							(wish.kind !== target.kind || activeIndex !== targetIndex)
						) {
							onMove(wish.id, target.kind, targetIndex)
						}
					}
				} else if (wish && overId?.startsWith('section:')) {
					const kind = overId.slice(8) as WishKind
					if (wish.kind !== kind) onMove(wish.id, kind)
				}
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
	const { setNodeRef, isOver, active } = useDroppable({ id: `section:${kind}` })
	return { ref: setNodeRef, isOver, isDragging: Boolean(active) }
}

export function useWishDrag(id: string) {
	const {
		setNodeRef: setDragRef,
		attributes,
		listeners,
		isDragging,
	} = useDraggable({ id })
	const {
		setNodeRef: setDropRef,
		isOver,
		active,
	} = useDroppable({
		id: `row:${id}`,
	})
	return {
		ref: (node: HTMLElement | null) => {
			setDragRef(node)
			setDropRef(node)
		},
		handle: { ...attributes, ...listeners },
		isDragging,
		isOver: isOver && active?.id !== id,
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
			className='-ml-1 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary active:cursor-grabbing sm:ml-0 sm:size-7'
		>
			<GripVertical className='size-4' />
		</button>
	)
}
