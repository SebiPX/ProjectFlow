import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    maxStars?: number;
    size?: number;
    readOnly?: boolean;
    onChange?: (rating: number) => void;
    showCount?: boolean;
    count?: number;
    className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    maxStars = 5,
    size = 16,
    readOnly = false,
    onChange,
    showCount = false,
    count = 0,
    className = ''
}) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleMouseEnter = (index: number) => {
        if (!readOnly) setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (!readOnly) setHoverRating(0);
    };

    const handleClick = (index: number) => {
        if (!readOnly && onChange) onChange(index);
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div 
                className="flex items-center"
                onMouseLeave={handleMouseLeave}
            >
                {[...Array(maxStars)].map((_, i) => {
                    const starValue = i + 1;
                    const isActive = starValue <= (hoverRating || rating);
                    
                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={readOnly}
                            className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                            onMouseEnter={() => handleMouseEnter(starValue)}
                            onClick={() => handleClick(starValue)}
                        >
                            <Star 
                                size={size}
                                className={`transition-colors ${
                                    isActive 
                                        ? 'fill-amber-400 text-amber-400' 
                                        : 'fill-transparent text-muted-foreground/30'
                                }`} 
                            />
                        </button>
                    );
                })}
            </div>
            {showCount && (
                <span className="text-sm text-muted-foreground">
                    ({count})
                </span>
            )}
        </div>
    );
};
