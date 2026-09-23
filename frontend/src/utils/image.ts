import { ASSET_URL } from '@/common/app'
import { THUMBNAIL_KEY_SUFFIX } from '@/common/constants'

const isExternal = (key: string) => key.startsWith('http')

export const fullImageUrl = (key: string) =>
	isExternal(key) ? key : `${ASSET_URL}/${key}`

export const thumbImageUrl = (key: string) =>
	isExternal(key) ? key : `${ASSET_URL}/${key}${THUMBNAIL_KEY_SUFFIX}`
