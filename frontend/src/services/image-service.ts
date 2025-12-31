import axios from '../common/axios'
import type { SignImageResponse } from '../types/dtos/images/sign-image'

export const ImageService = {
	getSignedUrl: (folder: string) =>
		axios
			.get<SignImageResponse>('/images/sign-url', { params: { folder } })
			.then(res => res.data),
}
