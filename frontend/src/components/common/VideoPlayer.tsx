import React from 'react'
import { useTranslation } from 'react-i18next'

interface VideoPlayerProps {
	src: string
	muted?: boolean
	autoPlay?: boolean
	loop?: boolean
	playsInline?: boolean
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
	src,
	muted = false,
	autoPlay = true,
	loop = true,
	playsInline = true,
}): React.JSX.Element => {
	const { t } = useTranslation()

	return (
		<div>
			<video
				muted={muted}
				autoPlay={autoPlay}
				loop={loop}
				playsInline={playsInline}
				className='w-full h-full object-cover'
			>
				<source src={src} type='video/mp4' />
				{t('errors.browser_video_tag')}
			</video>
		</div>
	)
}

export default VideoPlayer
