import React from 'react'
import { Navigate } from 'react-router'
import { useConfig } from '@/hooks/useConfig'
import { useIsAdmin } from '@/hooks/useIsAdmin'

const MenuLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement | null => {
	const { menu, isLoading } = useConfig()
	const { isAdmin, isVerifying } = useIsAdmin()
	if (isLoading || (!menu && isVerifying)) return null
	if (!menu && !isAdmin) return <Navigate to='/' replace />
	return <>{children}</>
}

export default MenuLayout
