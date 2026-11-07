import React from 'react'
import { Navigate } from 'react-router'
import { useConfig } from '@/hooks/useConfig'
import { useIsAdmin } from '@/hooks/useIsAdmin'

const FloorPlanLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement | null => {
	const { floorPlan, isLoading } = useConfig()
	const { isAdmin, isVerifying } = useIsAdmin()
	if (isLoading || (!floorPlan && isVerifying)) return null
	if (!floorPlan && !isAdmin) return <Navigate to='/tables' replace />
	return <>{children}</>
}

export default FloorPlanLayout
