import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/config/i18n'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

const LanguageTestCard = () => {
	const { lang, setLanguage } = useLanguage()
	const { t } = useTranslation()

	const languages = [
		{ code: 'en', name: 'English' },
		{ code: 'vi', name: 'Tiếng Việt' },
		{ code: 'th', name: 'ไทย' },
		{ code: 'zh', name: '中文' },
	]

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('dev.language_test.title')}</CardTitle>
				<CardDescription>{t('dev.language_test.description')}</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='space-y-2'>
					<Label htmlFor='language-select'>
						{t('dev.language_test.select_language')}
					</Label>
					<Select value={lang} onValueChange={setLanguage}>
						<SelectTrigger id='language-select'>
							<SelectValue placeholder={t('config.select_language')} />
						</SelectTrigger>
						<SelectContent>
							{languages.map(language => (
								<SelectItem key={language.code} value={language.code}>
									{language.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='rounded-lg bg-muted p-4 space-y-2'>
					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium'>
							{t('dev.language_test.current_language')}:
						</span>
						<Badge variant='secondary'>{lang.toUpperCase()}</Badge>
					</div>
					<div className='space-y-1'>
						<p className='text-sm text-muted-foreground'>
							{t('dev.language_test.translation_test')}:
						</p>
						<p className='text-sm font-semibold leading-relaxed'>
							{t('dev.lorem')}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default LanguageTestCard
