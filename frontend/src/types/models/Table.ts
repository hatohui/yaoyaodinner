import type { People } from './People'

export interface Table {
	id: string
	name: string
	capacity: number
	tableLeaderId: People['id'] | null
	isStaging: boolean
}
