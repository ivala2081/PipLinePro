import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { PageHeader, Section, ContentArea, CardGrid } from '../components/ProfessionalLayout';
import { Button } from '../components/ProfessionalButtons';

export default function Reports() {
  const { t } = useLanguage();
  const [selectedReport, setSelectedReport] = useState('financial');

  const reports = [
    {
      id: 'financial',
      name: 'Financial Reports',
      icon: TrendingUp,
      description: 'Revenue, expenses, and profit analysis',
    },
    {
      id: 'transaction',
      name: 'Transaction Reports',
      icon: BarChart3,
      description: 'Detailed transaction analysis and trends',
    },
    {
      id: 'client',
      name: 'Client Reports',
      icon: PieChart,
      description: 'Client performance and activity reports',
    },
    {
      id: 'agent',
      name: 'Agent Reports',
      icon: FileText,
      description: 'Agent performance and productivity reports',
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Enhanced Header */}
      <PageHeader
        title="Reports"
        subtitle="Generate and view comprehensive business reports"
        actions={
          <div className='flex items-center gap-3'>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className='h-4 w-4' />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className='h-4 w-4' />
              Date Range
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className='h-4 w-4' />
              Filters
            </Button>
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Download className='h-4 w-4' />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Report Types Section */}
      <Section title="Available Reports" subtitle="Select the type of report you want to generate">
        <CardGrid cols={4} gap="md">
          {reports.map(report => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`card cursor-pointer transition-colors ${
                selectedReport === report.id
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className='p-6'>
                <div className='flex items-center'>
                  <report.icon className='h-8 w-8 text-primary-600' />
                  <div className='ml-4'>
                    <h3 className='text-lg font-medium text-gray-900'>
                      {report.name}
                    </h3>
                    <p className='text-sm text-gray-500'>{report.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardGrid>
      </Section>

      {/* Report Content */}
      <ContentArea>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          {reports.find(r => r.id === selectedReport)?.name}
        </h2>

        <div className='space-y-6'>
          {/* Placeholder content for each report type */}
          {selectedReport === 'financial' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-4 bg-green-50 rounded-lg'>
                  <h4 className='font-medium text-green-900'>
                    {t('dashboard.total_revenue')}
                  </h4>
                  <p className='text-2xl font-bold text-green-600'>
                    $125,000
                  </p>
                </div>
                <div className='p-4 bg-red-50 rounded-lg'>
                  <h4 className='font-medium text-red-900'>Total Expenses</h4>
                  <p className='text-2xl font-bold text-red-600'>$45,000</p>
                </div>
                <div className='p-4 bg-blue-50 rounded-lg'>
                  <h4 className='font-medium text-blue-900'>Net Profit</h4>
                  <p className='text-2xl font-bold text-blue-600'>$80,000</p>
                </div>
              </div>
              <div className='h-64 bg-gray-100 rounded-lg flex items-center justify-center'>
                <p className='text-gray-500'>
                  Financial charts and graphs will be displayed here
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'transaction' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-4 bg-blue-50 rounded-lg'>
                  <h4 className='font-medium text-blue-900'>
                    {t('dashboard.total_transactions')}
                  </h4>
                  <p className='text-2xl font-bold text-blue-600'>1,234</p>
                </div>
                <div className='p-4 bg-green-50 rounded-lg'>
                  <h4 className='font-medium text-green-900'>Successful</h4>
                  <p className='text-2xl font-bold text-green-600'>1,180</p>
                </div>
                <div className='p-4 bg-yellow-50 rounded-lg'>
                  <h4 className='font-medium text-yellow-900'>Pending</h4>
                  <p className='text-2xl font-bold text-yellow-600'>54</p>
                </div>
              </div>
              <div className='h-64 bg-gray-100 rounded-lg flex items-center justify-center'>
                <p className='text-gray-500'>
                  Transaction charts and graphs will be displayed here
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'client' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-4 bg-purple-50 rounded-lg'>
                  <h4 className='font-medium text-purple-900'>
                    Total Clients
                  </h4>
                  <p className='text-2xl font-bold text-purple-600'>156</p>
                </div>
                <div className='p-4 bg-green-50 rounded-lg'>
                  <h4 className='font-medium text-green-900'>
                    {t('dashboard.active_clients')}
                  </h4>
                  <p className='text-2xl font-bold text-green-600'>142</p>
                </div>
                <div className='p-4 bg-blue-50 rounded-lg'>
                  <h4 className='font-medium text-blue-900'>
                    New This Month
                  </h4>
                  <p className='text-2xl font-bold text-blue-600'>12</p>
                </div>
              </div>
              <div className='h-64 bg-gray-100 rounded-lg flex items-center justify-center'>
                <p className='text-gray-500'>
                  Client analytics charts will be displayed here
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'agent' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-4 bg-indigo-50 rounded-lg'>
                  <h4 className='font-medium text-indigo-900'>
                    Total Agents
                  </h4>
                  <p className='text-2xl font-bold text-indigo-600'>24</p>
                </div>
                <div className='p-4 bg-green-50 rounded-lg'>
                  <h4 className='font-medium text-green-900'>
                    Active Agents
                  </h4>
                  <p className='text-2xl font-bold text-green-600'>22</p>
                </div>
                <div className='p-4 bg-yellow-50 rounded-lg'>
                  <h4 className='font-medium text-yellow-900'>
                    Avg. Performance
                  </h4>
                  <p className='text-2xl font-bold text-yellow-600'>87%</p>
                </div>
              </div>
              <div className='h-64 bg-gray-100 rounded-lg flex items-center justify-center'>
                <p className='text-gray-500'>
                  Agent performance charts will be displayed here
                </p>
              </div>
            </div>
          )}
        </div>
      </ContentArea>
    </div>
  );
}
