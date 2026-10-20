import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { cn } from '@/utils/shadcn'

interface PinInputProps {
	value: string
	onChange: (value: string) => void
	length?: number
	disabled?: boolean
	invalid?: boolean
	autoFocus?: boolean
	onComplete?: (value: string) => void
}

export function PinInput({
	value,
	onChange,
	length = 4,
	disabled,
	invalid,
	autoFocus,
	onComplete,
}: PinInputProps) {
	const refs = useRef<(HTMLInputElement | null)[]>([])

	const setDigit = (index: number, digit: string) => {
		const next = value.split('')
		next[index] = digit
		const joined = next.join('').slice(0, length)
		onChange(joined)
		if (digit && index < length - 1) refs.current[index + 1]?.focus()
		if (joined.length === length) onComplete?.(joined)
	}

	const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !value[index] && index > 0) {
			refs.current[index - 1]?.focus()
		}
	}

	const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault()
		const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
		if (!digits) return
		onChange(digits)
		refs.current[Math.min(digits.length, length - 1)]?.focus()
		if (digits.length === length) onComplete?.(digits)
	}

	return (
		<div className='flex justify-center gap-2.5'>
			{Array.from({ length }).map((_, i) => (
				<input
					key={i}
					ref={el => {
						refs.current[i] = el
					}}
					inputMode='numeric'
					maxLength={1}
					disabled={disabled}
					autoFocus={autoFocus && i === 0}
					value={value[i] ?? ''}
					onChange={e => setDigit(i, e.target.value.replace(/\D/g, '').slice(-1))}
					onKeyDown={e => handleKeyDown(i, e)}
					onPaste={handlePaste}
					className={cn(
						'size-12 rounded-2xl border bg-card text-center text-xl font-semibold text-foreground shadow-sm outline-none transition-colors',
						'focus:border-primary focus:ring-2 focus:ring-ring/40',
						invalid ? 'border-destructive' : 'border-border',
						disabled && 'opacity-60'
					)}
				/>
			))}
		</div>
	)
}
