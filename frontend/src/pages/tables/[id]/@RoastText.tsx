import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { popWords } from '@/utils/fireFx'
import { cn } from '@/utils/shadcn'

gsap.registerPlugin(useGSAP)

interface RoastTextProps {
	text: string
	animate?: boolean
	className?: string
}

export function RoastText({ text, animate = false, className }: RoastTextProps) {
	const ref = useRef<HTMLDivElement>(null)
	const lastText = useRef(text)
	const lines = text.split('\n').filter(line => line.trim())

	useGSAP(
		() => {
			const changed = lastText.current !== text
			lastText.current = text
			if (ref.current && (animate || changed)) popWords(ref.current)
		},
		{ dependencies: [text], scope: ref }
	)

	return (
		<div ref={ref} className={cn('flex flex-col gap-1.5', className)}>
			{lines.map((line, index) => (
				<p
					key={index}
					className={cn(
						'leading-snug',
						index === 0
							? 'text-base font-semibold text-foreground'
							: 'text-sm text-muted-foreground'
					)}
				>
					{line.split(/(\s+)/).map((part, i) =>
						part.trim() ? (
							<span key={i} data-word className='inline-block'>
								{part}
							</span>
						) : (
							part
						)
					)}
				</p>
			))}
		</div>
	)
}
