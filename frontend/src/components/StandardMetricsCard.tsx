import React, { memo } from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { MetricsCardSkeleton } from './EnhancedSkeletonLoaders';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  variant?: 'default' | 'gradient' | 'minimal' | 'compact';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'turquoise' | 'gray' | 'green' | 'red' | 'purple' | 'orange' | 'indigo' | 'teal' | 'pink';
  loading?: boolean;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

const enterpriseColorVariants = {
  // New enterprise color system
  primary: {
    iconBg: 'bg-blue-50',
    icon: 'text-blue-600',
    accent: '#2D5EFF'
  },
  success: {
    iconBg: 'bg-green-50',
    icon: 'text-green-600', 
    accent: '#16A34A'
  },
  warning: {
    iconBg: 'bg-amber-50',
    icon: 'text-amber-600',
    accent: '#F59E0B'
  },
  danger: {
    iconBg: 'bg-red-50',
    icon: 'text-red-600',
    accent: '#DC2626'
  },
  neutral: {
    iconBg: 'bg-gray-50',
    icon: 'text-gray-600',
    accent: '#6B7280'
  },
  turquoise: {
    iconBg: 'bg-teal-50',
    icon: 'text-teal-600',
    accent: '#2CC5A7'
  },
  // Backward compatibility mappings
  gray: {
    iconBg: 'bg-gray-50',
    icon: 'text-gray-600',
    accent: '#6B7280'
  },
  green: {
    iconBg: 'bg-green-50',
    icon: 'text-green-600',
    accent: '#16A34A'
  },
  red: {
    iconBg: 'bg-red-50',
    icon: 'text-red-600',
    accent: '#DC2626'
  },
  purple: {
    iconBg: 'bg-purple-50',
    icon: 'text-purple-600',
    accent: '#7C3AED'
  },
  orange: {
    iconBg: 'bg-orange-50',
    icon: 'text-orange-600',
    accent: '#F59E0B'
  },
  indigo: {
    iconBg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    accent: '#4F46E5'
  },
  teal: {
    iconBg: 'bg-teal-50',
    icon: 'text-teal-600',
    accent: '#2CC5A7'
  },
  pink: {
    iconBg: 'bg-pink-50',
    icon: 'text-pink-600',
    accent: '#EC4899'
  }
};

const StandardMetricsCard = memo<MetricsCardProps>(({
  title,
  value,
  change,
  changeType,
  icon,
  variant = 'default',
  color = 'primary',
  loading = false,
  subtitle,
  onClick,
  className = ''
}) => {
  const colors = enterpriseColorVariants[color] || enterpriseColorVariants.primary;
  const isClickable = !!onClick;

  // Enhanced loading skeleton
  if (loading) {
    return <MetricsCardSkeleton variant={variant} />;
  }

  // Render icon with enterprise sizing
  const renderIcon = () => {
    const IconComponent = icon;
    return <IconComponent style={{ width: 'var(--icon-default)', height: 'var(--icon-default)' }} />;
  };

  // Base card classes with enterprise styling
  const baseCardClasses = `
    enterprise-card
    ${isClickable ? 'cursor-pointer' : ''}
    ${className}
  `;

  // Variant-specific rendering
  switch (variant) {
    case 'gradient':
      return (
        <div 
          className={`${baseCardClasses} enterprise-card enterprise-card-gradient`}
          onClick={onClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div 
              className="rounded-lg flex items-center justify-center backdrop-blur-sm"
              style={{ 
                width: 'var(--space-8)', 
                height: 'var(--space-8)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="text-white">
                {renderIcon()}
              </div>
            </div>
            {change && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm`}>
                {changeType === 'positive' ? (
                  <TrendingUp style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
                ) : changeType === 'negative' ? (
                  <TrendingDown style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
                ) : null}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-white/90">{title}</h3>
            <p className="text-lg font-semibold text-white">{value}</p>
            {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
          </div>
        </div>
      );

    case 'minimal':
      return (
        <div 
          className={`${baseCardClasses} enterprise-card-compact`}
          onClick={onClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className={`${colors.iconBg} rounded-md flex items-center justify-center`}
                style={{ width: 'var(--space-6)', height: 'var(--space-6)' }}
              >
                <div className={colors.icon}>
                  {renderIcon()}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
                <p className="text-base font-semibold text-gray-900">{value}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
              </div>
            </div>
            {change && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                changeType === 'positive' 
                  ? 'enterprise-status-success' 
                  : changeType === 'negative' 
                  ? 'enterprise-status-danger' 
                  : 'text-gray-600'
              }`}>
                {changeType === 'positive' ? (
                  <TrendingUp style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
                ) : changeType === 'negative' ? (
                  <TrendingDown style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
                ) : null}
                <span>{change}</span>
              </div>
            )}
          </div>
        </div>
      );

    case 'compact':
      return (
        <div 
          className={`${baseCardClasses} enterprise-card-compact`}
          onClick={onClick}
          style={{ padding: 'var(--space-2)' }}
        >
          <div className="flex items-center gap-2">
            <div 
              className={`${colors.iconBg} rounded-md flex items-center justify-center`}
              style={{ width: 'var(--space-6)', height: 'var(--space-6)' }}
            >
              <div className={colors.icon}>
                {renderIcon()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide truncate">{title}</h3>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{value}</p>
                {change && (
                  <span className={`text-xs font-medium ${
                    changeType === 'positive' 
                      ? 'enterprise-status-success' 
                      : changeType === 'negative' 
                      ? 'enterprise-status-danger' 
                      : 'text-gray-600'
                  }`}>
                    {change}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
            </div>
          </div>
        </div>
      );

    default: // 'default'
      return (
        <div className={baseCardClasses} onClick={onClick}>
          <div className="flex items-center justify-between mb-3">
            <div 
              className={`${colors.iconBg} rounded-lg flex items-center justify-center`}
              style={{ width: 'var(--space-8)', height: 'var(--space-8)' }}
            >
              <div className={colors.icon}>
                {renderIcon()}
              </div>
            </div>
            {change && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                changeType === 'positive'
                  ? 'enterprise-status-success'
                  : changeType === 'negative'
                  ? 'enterprise-status-danger'
                  : 'bg-gray-50 text-gray-700'
              }`}>
                {changeType === 'positive' ? (
                  <TrendingUp style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
                ) : changeType === 'negative' ? (
                  <TrendingDown style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }} />
                ) : null}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          {/* Enterprise accent line */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ backgroundColor: colors.accent }}
          />
        </div>
      );
  }
});

StandardMetricsCard.displayName = 'StandardMetricsCard';

export default StandardMetricsCard;
