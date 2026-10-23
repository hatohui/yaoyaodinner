import { useTranslation } from 'react-i18next'
import { House, RotateCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/shadcn'

interface ErrorFallbackProps {
	onRetry: () => void
	className?: string
}

/** Plain anchors and no router hooks, so it also works above the router. */
export function ErrorFallback({ onRetry, className }: ErrorFallbackProps) {
	const { t } = useTranslation()

	return (
		<div
			role='alert'
			className={cn(
				'mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center',
				className
			)}
		>
			<span className='flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive'>
				<TriangleAlert className='size-7' />
			</span>
			<div className='flex flex-col gap-1.5'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('error_boundary.title')}
				</h1>
				<p className='text-sm text-muted-foreground'>
					{t('error_boundary.description')}
				</p>
			</div>
			<div className='flex flex-wrap justify-center gap-2'>
				<Button className='gap-1.5 rounded-full' onClick={onRetry}>
					<RotateCw className='size-4' />
					{t('error_boundary.retry')}
				</Button>
				<Button variant='outline' className='gap-1.5 rounded-full' asChild>
					<a href='/'>
						<House className='size-4' />
						{t('error_boundary.home')}
					</a>
				</Button>
			</div>
		</div>
	)
}
