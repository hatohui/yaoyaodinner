import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTheme } from '@/config/theme'
import { Badge } from '@/components/ui/badge'
import { Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ThemeTestCard = () => {
	const [theme, toggleTheme] = useTheme()
	const { t } = useTranslation()

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('dev.theme_test.title')}</CardTitle>
				<CardDescription>{t('dev.theme_test.description')}</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='space-y-3'>
					<Label>{t('dev.theme_test.select_theme')}</Label>
					<RadioGroup value={theme} onValueChange={toggleTheme}>
						<div className='flex items-center space-x-2'>
							<RadioGroupItem value='light' id='light' />
							<Label
								htmlFor='light'
								className='flex items-center gap-2 cursor-pointer'
							>
								<Sun className='h-4 w-4' />
								{t('dev.theme_test.light')}
							</Label>
						</div>
						<div className='flex items-center space-x-2'>
							<RadioGroupItem value='dark' id='dark' />
							<Label
								htmlFor='dark'
								className='flex items-center gap-2 cursor-pointer'
							>
								<Moon className='h-4 w-4' />
								{t('dev.theme_test.dark')}
							</Label>
						</div>
					</RadioGroup>
				</div>

				<div className='rounded-lg bg-muted p-4 space-y-2'>
					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium'>
							{t('dev.theme_test.current_theme')}:
						</span>
						<Badge variant='secondary'>{theme}</Badge>
					</div>
					<div className='flex gap-2 mt-4'>
						<div className='h-10 w-10 rounded bg-primary' title='Primary' />
						<div className='h-10 w-10 rounded bg-secondary' title='Secondary' />
						<div className='h-10 w-10 rounded bg-accent' title='Accent' />
						<div className='h-10 w-10 rounded bg-muted' title='Muted' />
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default ThemeTestCard
