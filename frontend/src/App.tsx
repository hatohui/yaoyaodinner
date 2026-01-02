import React from 'react'
import registerGSAPPlugins from './config/registerGSAPPlugins'
import { RouterProvider } from 'react-router'
import router from './config/dynamicRouter'
import LanguageProvider from './config/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ThemeProvider from './config/theme'

registerGSAPPlugins()

const App = (): React.ReactNode => {
	const client = new QueryClient()

	return (
		<QueryClientProvider client={client}>
			<LanguageProvider>
				<ThemeProvider>
					<RouterProvider router={router} />
				</ThemeProvider>
			</LanguageProvider>
		</QueryClientProvider>
	)
}

export default App
