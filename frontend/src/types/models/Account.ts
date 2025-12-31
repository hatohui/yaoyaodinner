import type { People } from './People'

export interface Account {
	userId: People['id']
	username: string
	password: string
}
