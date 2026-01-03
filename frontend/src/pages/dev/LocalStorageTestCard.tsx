import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation } from 'react-i18next'

const LocalStorageTestCard = () => {
	const { t } = useTranslation()
	const [storageKeys, setStorageKeys] = useState<
		Array<{ key: string; value: string }>
	>([])

	const loadStorageKeys = () => {
		const keys: Array<{ key: string; value: string }> = []
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key) {
				const value = localStorage.getItem(key) || ''
				keys.push({ key, value })
			}
		}
		setStorageKeys(keys)
	}

	useEffect(() => {
		loadStorageKeys()

		// Listen for storage changes
		const handleStorageChange = () => {
			loadStorageKeys()
		}

		window.addEventListener('storage', handleStorageChange)

		// Also check periodically in case changes happen in same window
		const interval = setInterval(loadStorageKeys, 1000)

		return () => {
			window.removeEventListener('storage', handleStorageChange)
			clearInterval(interval)
		}
	}, [])

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('dev.storage_test.title')}</CardTitle>
				<CardDescription>{t('dev.storage_test.description')}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium'>
							{t('dev.storage_test.total_keys')}:
						</span>
						<Badge variant='secondary'>{storageKeys.length}</Badge>
					</div>

					<ScrollArea className='h-[200px] w-full rounded-md border p-4'>
						{storageKeys.length === 0 ? (
							<p className='text-sm text-muted-foreground text-center py-4'>
								{t('dev.storage_test.no_keys')}
							</p>
						) : (
							<div className='space-y-3'>
								{storageKeys.map(({ key, value }) => (
									<div key={key} className='rounded-lg bg-muted p-3 space-y-1'>
										<div className='flex items-center justify-between'>
											<code className='text-xs font-semibold text-primary'>
												{key}
											</code>
										</div>
										<code className='text-xs text-muted-foreground break-all'>
											{value.length > 100
												? `${value.substring(0, 100)}...`
												: value}
										</code>
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</div>
			</CardContent>
		</Card>
	)
}

export default LocalStorageTestCard
