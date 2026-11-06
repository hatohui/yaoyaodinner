import React, { Suspense, useState } from 'react'
import registerGSAPPlugins from './config/registerGSAPPlugins'
import { RouterProvider } from 'react-router'
import router from './config/dynamicRouter'
import LanguageProvider from './config/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanStackDevtools } from '@tanstack/react-devtools'
import ThemeProvider from './config/theme'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import tanstackConfig from './config/tanstack'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { GlobalLoading } from './components/common/GlobalLoading'
import { AppErrorBoundary } from './components/common/AppErrorBoundary'

registerGSAPPlugins()

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
			{import.meta.env.DEV && (
				<TanStackDevtools
					plugins={[
						{
							name: 'TanStack Query',
							render: <ReactQueryDevtoolsPanel />,
							defaultOpen: true,
						},
					]}
				/>
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
