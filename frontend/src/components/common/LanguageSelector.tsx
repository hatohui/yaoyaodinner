import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/config/i18n'
import { useTranslation } from 'react-i18next'

const languages = [
	{ code: 'en', name: 'English', flag: '🇺🇸' },
	{ code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
	{ code: 'th', name: 'ไทย', flag: '🇹🇭' },
	{ code: 'zh', name: '中文', flag: '🇨🇳' },
]

export const LanguageSelector = () => {
	const { lang, setLanguage } = useLanguage()
	const { t } = useTranslation()

	return (
		<Select value={lang} onValueChange={setLanguage}>
			<SelectTrigger className='w-[180px]'>
				<SelectValue placeholder={t('select_language')} />
			</SelectTrigger>
			<SelectContent>
				{languages.map(language => (
					<SelectItem key={language.code} value={language.code}>
						<span className='flex items-center gap-2'>
							<span>{language.flag}</span>
							<span>{language.name}</span>
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
