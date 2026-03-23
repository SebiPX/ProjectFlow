import React, { useState, useEffect } from 'react';
import { getClientLogoSignedUrl } from '../../services/api/clients';
import { Icon } from './Icon';

interface ClientLogoProps {
  logoPath: string | null | undefined;
  companyName: string;
  className?: string;
}

export const ClientLogo: React.FC<ClientLogoProps> = ({
  logoPath,
  companyName,
  className = 'w-12 h-12 rounded-lg',
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (logoPath) {
      setLoading(true);
      setError(false);
      getClientLogoSignedUrl(logoPath)
        .then(url => {
          setLogoUrl(url);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading client logo:', err);
          setError(true);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [logoPath]);

  if (loading) {
    return (
      <div className={`${className} bg-muted animate-pulse`} />
    );
  }

  if (error || !logoUrl) {
    // Fallback icon
    return (
      <div className={`${className} bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground`}>
        <Icon
          path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3.001 3.001 0 01-2.704-2.143M8 11V7a4 4 0 118 0v4m-2 8h2"
          className="w-6 h-6"
        />
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${companyName} logo`}
      className={`${className} object-cover`}
      onError={() => setError(true)}
    />
  );
};
