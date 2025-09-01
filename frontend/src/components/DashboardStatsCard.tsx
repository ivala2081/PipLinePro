import React, { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  iconBgColor: string;
  iconColor: string;
}

const DashboardStatsCard = memo<StatsCardProps>(({
  title,
  value,
  change,
  changeType,
  icon,
  bgColor,
  textColor,
  iconBgColor,
  iconColor
}) => {
  return (
    <div className={`business-card relative overflow-hidden ${bgColor} transition-all duration-200 ease-out group cursor-pointer hover:shadow-lg`}>
      {/* Content */}
      <div className='business-card-body'>
        <div className='flex items-center justify-between mb-4'>
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200`}>
            <div className={`${iconColor} group-hover:scale-105 transition-transform duration-200`}>
              {icon}
            </div>
          </div>
          
          {/* Change Indicator */}
          <div className={`business-badge ${
            changeType === 'positive' 
              ? 'business-badge-success' 
              : 'business-badge-danger'
          }`}>
            {changeType === 'positive' ? (
              <TrendingUp className='h-3 w-3 mr-1' />
            ) : (
              <TrendingDown className='h-3 w-3 mr-1' />
            )}
            <span>{change}</span>
          </div>
        </div>
        
        <div className='space-business-sm'>
          <h3 className={`text-sm font-medium ${textColor} opacity-80`}>
            {title}
          </h3>
          <p className={`text-2xl font-bold ${textColor}`}>
            {value}
          </p>
        </div>
      </div>
      
      {/* Bottom Accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent`} />
    </div>
  );
});

DashboardStatsCard.displayName = 'DashboardStatsCard';

export default DashboardStatsCard;

