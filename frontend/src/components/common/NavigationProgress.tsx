import { useEffect, useState } from 'react'
import { useNavigation } from 'react-router'

const SHOW_AFTER_MS = 120

export const NavigationProgress = () => {
	const busy = useNavigation().state !== 'idle'
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		if (!busy) {
			setVisible(false)
			return
		}
		// instant navigations to an already-loaded page shouldn't flash the bar
		const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS)
		return () => clearTimeout(timer)
	}, [busy])

	if (!visible) return null

	return (
		<div
			role='progressbar'
			aria-busy
			className='fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/15'
		>
			<div className='h-full w-full origin-left animate-progress bg-primary' />
		</div>
	)
}
