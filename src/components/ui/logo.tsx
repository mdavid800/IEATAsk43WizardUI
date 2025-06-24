import { Wind } from 'lucide-react';

interface LogoProps {
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    showText?: boolean;
    variant?: 'default' | 'header' | 'hero' | 'clean';
}

export function Logo({ className = '', size = 'md', showText = true, variant = 'default' }: LogoProps) {
    const sizeClasses = {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-20 w-20',
        '2xl': 'h-24 w-24'
    };

    const textSizeClasses = {
        xs: { title: 'text-lg', subtitle: 'text-xs' },
        sm: { title: 'text-xl', subtitle: 'text-sm' },
        md: { title: 'text-2xl', subtitle: 'text-sm' },
        lg: { title: 'text-3xl', subtitle: 'text-base' },
        xl: { title: 'text-4xl', subtitle: 'text-lg' },
        '2xl': { title: 'text-5xl', subtitle: 'text-xl' }
    };

    const logoSize = sizeClasses[size];
    const textSize = textSizeClasses[size];

    const getVariantClasses = () => {
        switch (variant) {
            case 'header':
                return 'bg-white/95 border border-gray-200 rounded-xl p-2 shadow-sm';
            case 'hero':
                return 'bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-4 shadow-lg';
            case 'clean':
                return ''; // No background, border, or padding
            default:
                return 'bg-white/90 rounded-lg p-2';
        }
    };

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <div className={`relative ${getVariantClasses()}`}>
                {/* Try to load custom logo first, fallback to Wind icon */}
                <img
                    src="/logo.png"
                    alt="IEA Task 43 Logo"
                    className={`${logoSize} object-contain rounded-lg`}
                    onError={(e) => {
                        // If logo fails to load, hide the image and show the fallback
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                    }}
                />
                {/* Fallback Wind icon */}
                <div
                    className={`p-3 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center ${logoSize} hidden`}
                    style={{ display: 'none' }}
                >
                    <Wind className="h-3/4 w-3/4 text-white" />
                </div>
            </div>
            {showText && (
                <div>
                    <h1 className={`${textSize.title} font-bold text-gray-900`}>IEA Task 43</h1>
                    <p className={`${textSize.subtitle} text-gray-600`}>WRA Data Model</p>
                </div>
            )}
        </div>
    );
} 