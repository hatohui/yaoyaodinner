import { type ComponentProps, useLayoutEffect, useRef, useState } from 'react'
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
	...props
}: TruncatedTextProps) {
	const ref = useRef<HTMLSpanElement>(null)
	const [cut, setCut] = useState(false)

	useLayoutEffect(() => {
		const el = ref.current
		if (!el) return
		const check = () => setCut(el.scrollWidth > el.clientWidth)
		check()
		const observer = new ResizeObserver(check)
		observer.observe(el)
		return () => observer.disconnect()
	}, [text])

	return (
		<Tooltip open={cut ? undefined : false}>
			<TooltipTrigger asChild>
				<span ref={ref} className={cn('truncate', className)} {...props}>
					{text}
				</span>
			</TooltipTrigger>
			<TooltipContent className='max-w-xs break-words whitespace-pre-wrap'>
				{text}
			</TooltipContent>
		</Tooltip>
	)
}
