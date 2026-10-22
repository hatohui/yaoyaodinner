import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/config/i18n'
import { Globe } from 'lucide-react'

const languages = [
	{ code: 'en', name: 'English' },
	{ code: 'vi', name: 'Tiếng Việt' },
	{ code: 'th', name: 'ไทย' },
	{ code: 'zh', name: '中文' },
]

export const LanguageSelector = () => {
	const { lang, setLanguage } = useLanguage()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className='flex h-8 w-auto items-center gap-1.5 rounded-full border-none bg-transparent px-2.5 outline-none shadow-none transition-colors hover:bg-accent focus:ring-0 focus:outline-none'>
				<Globe className='size-3.5 shrink-0 text-muted-foreground' />
				<span className='text-xs font-semibold uppercase'>{lang}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-36 rounded-xl'>
				{languages.map(l => (
					<DropdownMenuItem
						key={l.code}
						onClick={() => setLanguage(l.code)}
						className={`cursor-pointer rounded-lg ${l.code === lang ? 'bg-primary/10 text-primary font-semibold' : ''}`}
					>
						{l.name}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
