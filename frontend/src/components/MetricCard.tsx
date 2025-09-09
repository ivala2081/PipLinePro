import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { UnifiedCard } from '../design-system';
import { CardContent } from '../components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'indigo' | 'pink';
  subtitle?: string;
  className?: string;
}

const colorMap = {
  blue: {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100'
  },
  green: {
    text: 'text-green-600',
    bg: 'bg-green-50',
    iconBg: 'bg-green-100'
  },
  purple: {
    text: 'text-purple-600',
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100'
  },
  orange: {
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-100'
  },
  red: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    iconBg: 'bg-red-100'
  },
  teal: {
    text: 'text-teal-600',
    bg: 'bg-teal-50',
    iconBg: 'bg-teal-100'
  },
  indigo: {
    text: 'text-indigo-600',
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100'
  },
  pink: {
    text: 'text-pink-600',
    bg: 'bg-pink-50',
    iconBg: 'bg-pink-100'
  }
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color,
  subtitle,
  className = ''
}) => {
  const colors = colorMap[color];
  
  return (
    <UnifiedCard variant="elevated" className={`relative overflow-hidden ${className}`}>
      {/* Background decorative element */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -translate-y-16 translate-x-16`}></div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          {change && (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${colors.text}`}>
                {change}
              </span>
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : trend === 'down' ? (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </UnifiedCard>
  );
};

export default MetricCard;
