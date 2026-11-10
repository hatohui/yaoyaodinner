import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/shadcn'

interface SearchBarProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
}

export function SearchBar({
	value,
	onChange,
	placeholder,
	className,
}: SearchBarProps) {
	return (
		<div className={cn('relative', className)}>
			<Search className='pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
			<Input
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				className='rounded-full border-border bg-card pl-10 shadow-sm dark:border-border dark:bg-card dark:focus:bg-card'
			/>
		</div>
	)
}
