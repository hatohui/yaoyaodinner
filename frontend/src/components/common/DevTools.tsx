import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'

export default function DevTools() {
	return (
		<TanStackDevtools
			plugins={[
				{
					name: 'TanStack Query',
					render: <ReactQueryDevtoolsPanel />,
					defaultOpen: true,
				},
			]}
		/>
	)
}
