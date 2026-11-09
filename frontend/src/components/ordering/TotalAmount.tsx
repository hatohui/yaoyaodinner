import { useTranslation } from 'react-i18next'

interface TotalAmountProps {
	amount: number
	currency?: string
	/** Some seasonal dishes have no price yet, so the real amount is higher. */
	partial?: boolean
}

export function TotalAmount({ amount, currency, partial }: TotalAmountProps) {
	const { t } = useTranslation()
	const text = currency ? `${amount.toFixed(2)} ${currency}` : amount.toFixed(2)
	return <>{partial ? t('orders.from_amount', { amount: text }) : text}</>
}
