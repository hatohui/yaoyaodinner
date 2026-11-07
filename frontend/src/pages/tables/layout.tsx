import React from 'react'
import { Navigate } from 'react-router'
import { useConfig } from '@/hooks/useConfig'
import { useGuest } from '@/hooks/useGuest'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { PinUnlock } from '@/components/common/PinUnlock'

const TablesLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement | null => {
	const { tables, isLoading } = useConfig()
	const pin = useGuest(s => s.pin)
	const { isAdmin, isVerifying } = useIsAdmin()
	if (isLoading || ((!tables || !pin) && isVerifying)) return null
	if (!tables && !isAdmin) return <Navigate to='/' replace />
	if (!pin && !isAdmin) return <PinUnlock />
	return <>{children}</>
}

export default TablesLayout
