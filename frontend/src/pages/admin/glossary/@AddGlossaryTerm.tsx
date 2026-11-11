import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import type { SaveGlossaryTermDto } from '@/api/model'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { GLOSSARY_FIELDS, type GlossaryField } from './@useGlossary'

const EMPTY = Object.fromEntries(GLOSSARY_FIELDS.map(f => [f, ''])) as Record<
	GlossaryField,
	string
>

interface AddGlossaryTermProps {
	pending: boolean
	onAdd: (data: SaveGlossaryTermDto) => Promise<unknown>
}

export function AddGlossaryTerm({ pending, onAdd }: AddGlossaryTermProps) {
	const { t } = useTranslation()
	const [values, setValues] = useState(EMPTY)
	const hasTerm = (['en', 'vi', 'zh', 'th'] as const).some(f =>
		values[f].trim()
	)

	const submit = async () => {
		await onAdd(
			Object.fromEntries(
				GLOSSARY_FIELDS.map(f => [f, values[f].trim() || null])
			)
		)
		setValues(EMPTY)
	}

	return (
		<form
			className='grid grid-cols-2 gap-2 rounded-2xl border border-dashed border-primary/40 p-3 sm:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.5fr)_auto] sm:items-center'
			onSubmit={e => {
				e.preventDefault()
				if (hasTerm) void submit().catch(() => undefined)
			}}
		>
			{GLOSSARY_FIELDS.map(field => (
				<Input
					key={field}
					aria-label={t(`admin.glossary.fields.${field}`)}
					placeholder={t(`admin.glossary.fields.${field}`)}
					value={values[field]}
					onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
					className={field === 'note' ? 'col-span-2 sm:col-span-1' : undefined}
				/>
			))}
			<Button
				type='submit'
				className='col-span-2 gap-1.5 rounded-full sm:col-span-1'
				disabled={!hasTerm || pending}
			>
				{pending ? <Spinner className='size-3.5' /> : <Plus />}
				{t('admin.glossary.add')}
			</Button>
		</form>
	)
}
