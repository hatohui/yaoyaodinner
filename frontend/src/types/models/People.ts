import type { Table } from './Table'

export interface People {
	id: string
	name: string
	tableId: Table['id'] | null
}
