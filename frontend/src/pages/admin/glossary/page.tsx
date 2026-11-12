import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { AddGlossaryTerm } from './@AddGlossaryTerm'
import { GlossaryRow } from './@GlossaryRow'
import { useGlossary } from './@useGlossary'

export default function AdminGlossaryPage() {
	const { t } = useTranslation()
	const { terms, isLoading, creating, create, update, remove } = useGlossary()

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-col gap-1'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.glossary.title')}
				</h1>
				<p className='text-sm text-muted-foreground'>
					{t('admin.glossary.subtitle')}
				</p>
			</div>

			<AddGlossaryTerm pending={creating} onAdd={create} />

			{isLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : terms.length === 0 ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('admin.glossary.empty')}
				</p>
			) : (
				<ul className='flex flex-col gap-2'>
					{terms.map(term => (
						<GlossaryRow
							key={term.id}
							term={term}
							onSave={patch => update(term.id, patch)}
							onDelete={() => remove(term.id)}
						/>
					))}
				</ul>
			)}
		</div>
	)
}
