export interface Language {
	code: string
	name: string
	direction: LanguageDirection
}

export type LanguageDirection = 'LTR' | 'RTL'
