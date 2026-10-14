import React, { useState } from 'react'
import { getSignedPhotoUrl } from '../../services/issuesService'

interface SecureImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  fallbackIcon?: React.ReactNode
}

/**
 * A secure image component that renders private storage photos.
 * If the current signed URL has expired or fails to load (HTTP 400/403/network error),
 * it automatically fetches a freshly signed URL from Supabase Storage without
 * requiring a full page reload.
 */
export function SecureImage({ src, alt = '', className = '', fallbackIcon, ...rest }: SecureImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src ?? null)
  const [hasRefreshed, setHasRefreshed] = useState(false)
  const [failed, setFailed] = useState(false)

  // Update currentSrc when parent prop changes
  React.useEffect(() => {
    setCurrentSrc(src ?? null)
    setHasRefreshed(false)
    setFailed(false)
  }, [src])

  const handleError = async () => {
    // If we haven't attempted a token refresh yet and we have a path or URL, try refreshing
    if (!hasRefreshed && src) {
      setHasRefreshed(true)
      const freshUrl = await getSignedPhotoUrl(src)
      if (freshUrl && freshUrl !== currentSrc) {
        setCurrentSrc(freshUrl)
        return
      }
    }
    setFailed(true)
  }

  if (!currentSrc || failed) {
    return fallbackIcon ? <>{fallbackIcon}</> : null
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...rest}
    />
  )
}
