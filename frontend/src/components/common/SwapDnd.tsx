import { createContext, useContext, useState, type ReactNode } from 'react'
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'

interface SwapItem {
	id: string
	no: number
	name: string
}

const ActiveSwapItem = createContext<SwapItem | undefined>(undefined)

interface SwapDndProps {
	items: SwapItem[]
	onSwap: (activeId: string, overId: string) => void
	children: ReactNode
}

/** Drop one item onto another to swap their numbers - works with mouse, touch and keyboard. */
export function SwapDnd({ items, onSwap, children }: SwapDndProps) {
	const [activeId, setActiveId] = useState<string>()
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor)
	)
	const active = items.find(item => item.id === activeId)

	const end = () => setActiveId(undefined)

	return (
		<DndContext
			sensors={sensors}
			onDragStart={e => setActiveId(String(e.active.id))}
			onDragCancel={end}
			onDragEnd={e => {
				const target = e.over && String(e.over.id)
				if (target && target !== e.active.id)
					onSwap(String(e.active.id), target)
				end()
			}}
		>
			<ActiveSwapItem.Provider value={active}>
				{children}
			</ActiveSwapItem.Provider>
			<DragOverlay>
				{active && (
					<span className='flex w-fit cursor-grabbing items-center gap-2 rounded-full border border-primary bg-card py-1 pr-3 pl-1 shadow-lg'>
						<span className='flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold tabular-nums text-primary-foreground'>
							{active.no}
						</span>
						<span className='max-w-40 truncate text-sm font-semibold text-foreground'>
							{active.name}
						</span>
					</span>
				)}
			</DragOverlay>
		</DndContext>
	)
}

export function useSwapItem(id: string) {
	const active = useContext(ActiveSwapItem)
	const drag = useDraggable({ id })
	const drop = useDroppable({ id })
	const isTarget = drop.isOver && !drag.isDragging

	return {
		setNodeRef: (node: HTMLElement | null) => {
			drag.setNodeRef(node)
			drop.setNodeRef(node)
		},
		handleProps: {
			ref: drag.setActivatorNodeRef,
			...drag.listeners,
			...drag.attributes,
		},
		isDragging: drag.isDragging,
		isTarget,
		swapPreviewNo: isTarget ? active?.no : undefined,
	}
}

export function SwapItem({
	id,
	children,
}: {
	id: string
	children: (item: ReturnType<typeof useSwapItem>) => ReactNode
}) {
	return children(useSwapItem(id))
}
