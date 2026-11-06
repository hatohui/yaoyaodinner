import React, { Suspense, lazy, useState } from 'react'
import { RouterProvider } from 'react-router'
import router from './config/dynamicRouter'
import LanguageProvider from './config/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ThemeProvider from './config/theme'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import tanstackConfig from './config/tanstack'
import { GlobalLoading } from './components/common/GlobalLoading'
import { AppErrorBoundary } from './components/common/AppErrorBoundary'

// dev-only, and lazy so the devtools never ship in the production bundle
const DevTools = import.meta.env.DEV
	? lazy(() => import('./components/common/DevTools'))
	: null

const AppContent = (): React.ReactNode => {
	const [client] = useState(() => new QueryClient(tanstackConfig))

	return (
		<QueryClientProvider client={client}>
			<ThemeProvider>
				<TooltipProvider>
					<RouterProvider router={router} />
					<Toaster richColors position='bottom-right' />
				</TooltipProvider>
			</ThemeProvider>
			{DevTools && (
				<Suspense fallback={null}>
					<DevTools />
				</Suspense>
			)}
		</QueryClientProvider>
	)
}

const App = (): React.ReactNode => {
	return (
		<Suspense fallback={<GlobalLoading />}>
			<AppErrorBoundary>
				<LanguageProvider>
					<AppContent />
				</LanguageProvider>
			</AppErrorBoundary>
		</Suspense>
	)
}

export default App
