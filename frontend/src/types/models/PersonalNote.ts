import type { People } from './People'

export interface PersonalNote {
	id: string
	personId: People['id']
	content: string
}
