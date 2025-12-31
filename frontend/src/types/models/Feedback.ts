import type { People } from './People'

export interface Feedback {
	id: string
	by: People['id'] | null
	content: string | null
	updatedAt: string
	createdAt: string
}
