import React from 'react'
import { Navigate, useParams } from 'react-router'
import { useConfig } from '@/hooks/useConfig'
import { useIsAdmin } from '@/hooks/useIsAdmin'

const TableOrderLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement | null => {
	const { id = '' } = useParams()
	const { menu, isLoading } = useConfig()
	const { isAdmin, isVerifying } = useIsAdmin()
	if (isLoading || (!menu && isVerifying)) return null
	if (!menu && !isAdmin) return <Navigate to={`/tables/${id}`} replace />
	return <>{children}</>
}

export default TableOrderLayout
