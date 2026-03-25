import React, { useEffect, useState } from 'react';
import {
  AvatarProfileLike,
  DEFAULT_PROFILE_AVATAR_PATH,
  getDefaultProfileAvatarUrl,
  getProfileAvatarPath,
  getProfileAvatarUrl,
} from '../../utils/profileAvatar';

interface ProfileAvatarProps extends AvatarProfileLike {
  nickname: string;
  containerClassName: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  nickname,
  rank,
  avatar_url,
  containerClassName,
  imageClassName = 'w-full h-full object-cover',
  fallbackClassName = 'bg-blue-600 text-white text-sm font-bold',
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [usedDefaultFallback, setUsedDefaultFallback] = useState(false);

  useEffect(() => {
    setImageSrc(getProfileAvatarUrl({ rank, avatar_url }));
    setUsedDefaultFallback(false);
  }, [rank, avatar_url]);

  const handleImageError = () => {
    if (!usedDefaultFallback && getProfileAvatarPath({ rank, avatar_url }) !== DEFAULT_PROFILE_AVATAR_PATH) {
      setImageSrc(getDefaultProfileAvatarUrl());
      setUsedDefaultFallback(true);
      return;
    }

    setImageSrc(null);
  };

  const initial = nickname.charAt(0).toUpperCase() || '?';

  return (
    <div className={containerClassName}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={nickname}
          className={imageClassName}
          onError={handleImageError}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${fallbackClassName}`}>
          {initial}
        </div>
      )}
    </div>
  );
};
