import React from 'react'
import registerGSAPPlugins from './config/registerGSAPPlugins'
import { RouterProvider } from 'react-router'
import router from './config/dynamicRouter'
import './config/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

registerGSAPPlugins()

const App = (): React.ReactNode => {
	const client = new QueryClient()

	return (
		<QueryClientProvider client={client}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	)
}

export default App
