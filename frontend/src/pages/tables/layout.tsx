import React from 'react'
import { useGuest } from '@/hooks/useGuest'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { PinUnlock } from '@/components/common/PinUnlock'

const TablesLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement | null => {
	const pin = useGuest(s => s.pin)
	const { isAdmin, isVerifying } = useIsAdmin()
	if (!pin && isVerifying) return null
	if (!pin && !isAdmin) return <PinUnlock />
	return <>{children}</>
}

export default TablesLayout
