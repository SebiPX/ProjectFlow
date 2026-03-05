import React from 'react';
import { getAvatarSignedUrl } from '../../services/api/profileSettings';

interface AvatarProps {
  src?: string | null;
  avatarPath?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  avatarPath,
  alt = 'User',
  size = 'md',
  className = '',
  isOnline = false
}) => {
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    // If we have a direct src, use it
    if (src) {
      setSignedUrl(src);
      return;
    }

    // If we have a storage path, get signed URL
    if (avatarPath) {
      if (avatarPath.startsWith('http')) {
        setSignedUrl(avatarPath);
      } else {
        const getUrl = async () => {
          try {
            const url = await getAvatarSignedUrl(avatarPath);
            if (url) {
              setSignedUrl(url);
            }
          } catch (e) {
            console.error('Failed to get signed URL for avatar', e);
          }
        };
        getUrl();
      }
    }
  }, [src, avatarPath]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const currentSize = sizeClasses[size];
  const finalSrc = signedUrl;

  return (
    <div className="relative inline-block">
      {finalSrc ? (
        <img
          src={finalSrc}
          alt={alt}
          className={`${currentSize} rounded-full object-cover border-2 border-gray-700 ${className}`}
        />
      ) : (
        <div className={`${currentSize} rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center text-gray-400 font-medium ${className}`}>
          {alt.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Online Status Indicator */}
      {isOnline && (
        <span className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-gray-900 bg-green-500 ${size === 'sm' ? 'w-2 h-2' :
            size === 'md' ? 'w-2.5 h-2.5' :
              size === 'lg' ? 'w-3 h-3' :
                'w-4 h-4'
          }`} />
      )}
    </div>
  );
};
