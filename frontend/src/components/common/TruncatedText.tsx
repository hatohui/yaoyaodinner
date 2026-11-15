import { type ComponentProps, useRef, useState } from 'react'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/utils/shadcn'

interface TruncatedTextProps extends ComponentProps<'span'> {
	text: string
}

/** Cuts long text to one line and shows all of it on hover, only when it was cut. */
export function TruncatedText({
	text,
	className,
	onPointerEnter,
	onFocus,
	...props
}: TruncatedTextProps) {
	const ref = useRef<HTMLSpanElement>(null)
	const [cut, setCut] = useState(false)

	const check = () => {
		const el = ref.current
		if (!el) return
		const next = el.scrollWidth > el.clientWidth
		if (next !== cut) setCut(next)
	}

	return (
		<Tooltip open={cut ? undefined : false}>
			<TooltipTrigger asChild>
				<span
					ref={ref}
					onPointerEnter={e => {
						check()
						onPointerEnter?.(e)
					}}
					onFocus={e => {
						check()
						onFocus?.(e)
					}}
					className={cn('truncate', className)}
					{...props}
				>
					{text}
				</span>
			</TooltipTrigger>
			{cut && (
				<TooltipContent className='max-w-xs break-words whitespace-pre-wrap'>
					{text}
				</TooltipContent>
			)}
		</Tooltip>
	)
}
