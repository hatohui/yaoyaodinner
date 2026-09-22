import { useTranslation } from 'react-i18next'

const QuoteSection = () => {
	const { t } = useTranslation()

	const quoteKeys = ['quotes.offer_socks'] as const
	const randomIndex = Math.floor(Math.random() * quoteKeys.length)

	return (
		<p className='mx-auto max-w-2xl text-lg font-medium text-white/90 drop-shadow-sm sm:text-xl'>
			{t(quoteKeys[randomIndex])}
		</p>
	)
}

export default QuoteSection
