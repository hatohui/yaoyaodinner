import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import type { GlossaryTermDto, SaveGlossaryTermDto } from '@/api/model'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GLOSSARY_FIELDS, type GlossaryField } from './@useGlossary'

interface GlossaryRowProps {
	term: GlossaryTermDto
	onSave: (patch: SaveGlossaryTermDto) => void
	onDelete: () => void
}

export function GlossaryRow({ term, onSave, onDelete }: GlossaryRowProps) {
	const { t } = useTranslation()
	const [values, setValues] = useState<Record<GlossaryField, string>>(
		() =>
			Object.fromEntries(
				GLOSSARY_FIELDS.map(f => [f, term[f] ?? ''])
			) as Record<GlossaryField, string>
	)

	const commit = (field: GlossaryField) => {
		const next = values[field].trim()
		if (next !== (term[field] ?? '')) onSave({ [field]: next || null })
	}

	return (
		<li className='grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm sm:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.5fr)_auto] sm:items-center'>
			{GLOSSARY_FIELDS.map(field => (
				<Input
					key={field}
					aria-label={t(`admin.glossary.fields.${field}`)}
					placeholder={t(`admin.glossary.fields.${field}`)}
					value={values[field]}
					onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
					onBlur={() => commit(field)}
					className={field === 'note' ? 'col-span-2 sm:col-span-1' : undefined}
				/>
			))}
			<Button
				variant='ghost'
				size='icon'
				aria-label={t('admin.glossary.delete')}
				title={t('admin.glossary.delete')}
				className='col-span-2 justify-self-end rounded-full text-muted-foreground hover:text-destructive sm:col-span-1'
				onClick={onDelete}
			>
				<Trash2 />
			</Button>
		</li>
	)
}
