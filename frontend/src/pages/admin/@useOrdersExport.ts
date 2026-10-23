import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useExportTables } from '@/api/tables/tables'
import type { TableExportDto } from '@/api/model'

export const EXPORT_FIELDS = [
	'no',
	'name',
	'host',
	'people',
	'foods',
	'variant',
	'quantity',
] as const

export type ExportField = (typeof EXPORT_FIELDS)[number]

const DEFAULT_FIELDS: ExportField[] = ['no', 'name', 'foods', 'quantity']

export function useOrdersExport(open: boolean, eventName: string) {
	const { i18n } = useTranslation()
	const [fields, setFields] = useState<Set<ExportField>>(
		() => new Set(DEFAULT_FIELDS)
	)
	// Tracks what was unticked so tables added after opening are included.
	const [excluded, setExcluded] = useState<Set<string>>(new Set())

	const { data: tables = [], isLoading } = useExportTables<TableExportDto[]>(
		{ lang: i18n.language },
		{ query: { enabled: open } }
	)

	const toggleField = (field: ExportField) =>
		setFields(prev => {
			const next = new Set(prev)
			if (next.has(field)) next.delete(field)
			else next.add(field)
			return next
		})

	const toggleTable = (id: string) =>
		setExcluded(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})

	const printable = tables.filter(t => !excluded.has(t.id))

	const toggleAllTables = () =>
		setExcluded(
			printable.length === tables.length
				? new Set(tables.map(t => t.id))
				: new Set()
		)

	// The browser's print dialog names the saved PDF after the document title.
	const print = () => {
		const previous = document.title
		document.title = eventName
		window.addEventListener('afterprint', () => (document.title = previous), {
			once: true,
		})
		window.print()
	}

	return {
		tables,
		isLoading,
		fields,
		toggleField,
		excluded,
		toggleTable,
		toggleAllTables,
		printable,
		print,
	}
}
