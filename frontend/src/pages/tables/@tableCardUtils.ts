import type { TableDto } from '@/api/model'
import { cn } from '@/utils/shadcn'

export function matchedPeople(table: TableDto) {
	// the host is already named on the card, so don't repeat it as a match
	return (table.matchedPeople ?? []).filter(
		name => name !== table.tableLeaderName
	)
}

export const tableCardClass = (isMine: boolean) =>
	cn(
		'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
		isMine && 'border-primary ring-2 ring-primary/40'
	)

const DEFAULT_BANNERS = [
	'1.webp',
	'2.webp',
	'3.webp',
	'4.webp',
	'5.png',
	'6.png',
	'7.png',
]

/** Tables without their own banner cycle through the stock food illustrations. */
export function defaultBannerSrc(tableNo: number) {
	const index = (Math.max(tableNo, 1) - 1) % DEFAULT_BANNERS.length
	return `/images/table-defaults/${DEFAULT_BANNERS[index]}`
}
