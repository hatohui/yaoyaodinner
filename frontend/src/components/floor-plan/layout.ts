import type { TableDto } from '@/api/model'

// Canvas units; table x/y are stored as percentages of this box.
export const CANVAS_W = 872
export const CANVAS_H = 1000

export type FloorId = 'first' | 'ground'

interface Rect {
	x: number
	y: number
	w: number
	h: number
}

interface Fixture extends Rect {
	labelKey?: 'bar' | 'kitchen' | 'fish_tank' | 'vip_room'
	emphasis?: boolean
}

export interface Floor extends Rect {
	id: FloorId
	labelKey: 'first_floor' | 'ground_floor'
	fixtures: Fixture[]
}

export const LABEL_H = 40
const WALL = 2

export const FLOORS: Floor[] = [
	{
		id: 'first',
		labelKey: 'first_floor',
		x: 0,
		y: LABEL_H,
		w: CANVAS_W,
		h: 450,
		fixtures: [
			{ x: 166, y: 40, w: WALL, h: 450 },
			{ x: 667, y: 191, w: 104, h: 124, labelKey: 'bar' },
			{ x: 771, y: 191, w: 101, h: 149 },
			{ x: 736, y: 315, w: 35, h: 25 },
			{ x: 736, y: 370, w: 136, h: 120, labelKey: 'vip_room', emphasis: true },
		],
	},
	{
		id: 'ground',
		labelKey: 'ground_floor',
		x: 0,
		y: 550,
		w: CANVAS_W,
		h: 450,
		fixtures: [
			{ x: 0, y: 550, w: 166, h: 153, labelKey: 'fish_tank' },
			{ x: 166, y: 550, w: WALL, h: 450 },
			{ x: 128, y: 800, w: 38, h: 105 },
			{ x: 357, y: 719, w: 33, h: 38 },
			{ x: 615, y: 550, w: 257, h: 238, labelKey: 'kitchen' },
			{ x: 771, y: 788, w: 50, h: 129 },
			{ x: 317, y: 948, w: 307, h: 52 },
		],
	},
]

const FLOOR_BANDS: Record<FloorId, { top: number; bottom: number }> = {
	first: { top: 0, bottom: 500 },
	ground: { top: 500, bottom: CANVAS_H },
}

export type OpenFloors = Record<FloorId, boolean>

/** The slice of the canvas (in canvas units) that the open floors cover. */
export const visibleBand = (open: OpenFloors) => {
	const bands = FLOORS.filter(floor => open[floor.id]).map(
		floor => FLOOR_BANDS[floor.id]
	)
	const top = Math.min(...bands.map(band => band.top))
	const bottom = Math.max(...bands.map(band => band.bottom))
	return { top, height: bottom - top }
}

export const toPercent = ({ x, y, w, h }: Rect) => ({
	left: `${(x / CANVAS_W) * 100}%`,
	top: `${(y / CANVAS_H) * 100}%`,
	width: `${(w / CANVAS_W) * 100}%`,
	height: `${(h / CANVAS_H) * 100}%`,
})

export const tableDiameter = (capacity: number) =>
	(Math.min(140, Math.max(70, 75 + capacity * 3.8)) / CANVAS_W) * 100

const inRange = (value: number | null | undefined): value is number =>
	value != null && value >= 0 && value <= 100

export const isOnMap = (
	table: TableDto
): table is TableDto & { x: number; y: number } =>
	inRange(table.x) && inRange(table.y)

export const floorOf = (yPercent: number): FloorId =>
	yPercent < 50 ? 'first' : 'ground'

export const floorSummary = (tables: TableDto[], floor: FloorId) => {
	const onFloor = tables.filter(t => isOnMap(t) && floorOf(t.y) === floor)
	return {
		tables: onFloor.length,
		pax: onFloor.reduce((sum, t) => sum + t.capacity, 0),
	}
}
