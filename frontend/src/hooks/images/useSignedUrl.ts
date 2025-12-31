import { useQuery } from '@tanstack/react-query'
import { ImageService } from '../../services/image-service'
import type { SignImageResponse } from '../../types/dtos/images/sign-image'

const useSignedUrl = (folder: string) =>
	useQuery<SignImageResponse>({
		queryKey: [],
		queryFn: () => ImageService.getSignedUrl(folder),
	})

export default useSignedUrl
