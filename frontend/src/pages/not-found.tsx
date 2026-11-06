import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { House, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
	const { t } = useTranslation()

	return (
		<div className='mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center'>
			<span className='flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
				<SearchX className='size-7' />
			</span>
			<div className='flex flex-col gap-1.5'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('not_found_page.title')}
				</h1>
				<p className='text-sm text-muted-foreground'>
					{t('not_found_page.description')}
				</p>
			</div>
			<Button className='gap-1.5 rounded-full' asChild>
				<Link to='/'>
					<House className='size-4' />
					{t('error_boundary.home')}
				</Link>
			</Button>
		</div>
	)
}
