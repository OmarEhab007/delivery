'use client';

/**
 * Optimized Image Component
 * Task: T151 [P] - Optimize images and add lazy loading
 */

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: React.ReactNode;
  showSkeleton?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  containerClassName?: string;
}

// =============================================================================
// ASPECT RATIO MAP
// =============================================================================

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  auto: '',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  fallback,
  showSkeleton = true,
  aspectRatio = 'auto',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg',
          aspectRatioClasses[aspectRatio],
          containerClassName
        )}
      >
        {fallback || (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">تعذر تحميل الصورة</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {isLoading && showSkeleton && (
        <Skeleton className="absolute inset-0 z-10" />
      )}
      <Image
        src={src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
    </div>
  );
}

// =============================================================================
// AVATAR IMAGE COMPONENT
// =============================================================================

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
  className?: string;
}

const avatarSizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function AvatarImage({
  src,
  alt,
  size = 'md',
  fallbackText,
  className,
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  const showFallback = !src || hasError;
  const initials = fallbackText?.charAt(0).toUpperCase() || alt.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-muted flex items-center justify-center',
        avatarSizes[size],
        className
      )}
    >
      {showFallback ? (
        <span className="font-medium text-muted-foreground">{initials}</span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setHasError(true)}
          sizes={size === 'xl' ? '64px' : size === 'lg' ? '48px' : size === 'md' ? '40px' : '32px'}
        />
      )}
    </div>
  );
}

// =============================================================================
// THUMBNAIL IMAGE COMPONENT
// =============================================================================

interface ThumbnailImageProps {
  src: string;
  alt: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const thumbnailSizes = {
  sm: { width: 48, height: 48 },
  md: { width: 80, height: 80 },
  lg: { width: 120, height: 120 },
};

export function ThumbnailImage({
  src,
  alt,
  onClick,
  size = 'md',
  className,
}: ThumbnailImageProps) {
  const dimensions = thumbnailSizes[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted transition-transform hover:scale-105',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={`${dimensions.width}px`}
      />
    </button>
  );
}

// =============================================================================
// IMAGE GALLERY COMPONENT
// =============================================================================

interface ImageGalleryProps {
  images: { src: string; alt: string }[];
  onImageClick?: (index: number) => void;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const columnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function ImageGallery({
  images,
  onImageClick,
  columns = 3,
  gap = 'md',
  className,
}: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <ImageIcon className="h-8 w-8 ml-2" />
        <span>لا توجد صور</span>
      </div>
    );
  }

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          width={300}
          height={200}
          aspectRatio="video"
          containerClassName={cn(
            'rounded-lg overflow-hidden',
            onImageClick && 'cursor-pointer hover:opacity-80 transition-opacity'
          )}
          className="object-cover w-full h-full"
          onClick={() => onImageClick?.(index)}
        />
      ))}
    </div>
  );
}

export default OptimizedImage;
