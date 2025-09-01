import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  PieChart,
  Activity,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader, Section, ContentArea, CardGrid } from '../components/ProfessionalLayout';
import { Button } from '../components/ProfessionalButtons';

interface PspSummary {
  psp: string;
  total_amount: number;
  total_commission: number;
  total_net: number;
  transaction_count: number;
}

interface CategorySummary {
  category: string;
  total_amount: number;
  total_commission: number;
  total_net: number;
  transaction_count: number;
}

interface ClientSummary {
  client_name: string;
  total_amount: number;
  total_commission: number;
  total_net: number;
  transaction_count: number;
}

interface AnalyticsData {
  psp_summary: PspSummary[];
  category_summary: CategorySummary[];
  client_summary: ClientSummary[];
  date_range: {
    start_date: string;
    end_date: string;
  };
}

export default function Analytics() {
  const { t } = useLanguage();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/overview', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else if (response.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className='space-y-8'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900'>
            {t('analytics.title')}
          </h1>
          <p className='text-gray-600'>{t('analytics.description')}</p>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {[1, 2].map(i => (
            <div key={i} className='card animate-pulse'>
              <div className='p-6'>
                <div className='w-32 h-6 bg-gray-200 rounded mb-4'></div>
                <div className='space-y-3'>
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className='flex justify-between'>
                      <div className='w-24 h-4 bg-gray-200 rounded'></div>
                      <div className='w-16 h-4 bg-gray-200 rounded'></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-8'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900'>
            {t('analytics.title')}
          </h1>
          <p className='text-gray-600'>{t('analytics.description')}</p>
        </div>
        <div className='card'>
          <div className='p-8 text-center'>
            <div className='text-red-500 mb-4'>
              <BarChart3 className='h-12 w-12 mx-auto' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Error Loading Analytics
            </h3>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button onClick={fetchAnalyticsData} className='btn btn-primary'>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className='space-y-8'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900'>
            {t('analytics.title')}
          </h1>
          <p className='text-gray-600'>{t('analytics.description')}</p>
        </div>
        <div className='card'>
          <div className='p-8 text-center'>
            <div className='text-gray-400 mb-4'>
              <BarChart3 className='h-12 w-12 mx-auto' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              No Analytics Data
            </h3>
            <p className='text-gray-600'>
              No analytics data is currently available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals for percentages
  const totalAmount = analyticsData.psp_summary.reduce(
    (sum, item) => sum + item.total_amount,
    0
  );
  const totalCommission = analyticsData.psp_summary.reduce(
    (sum, item) => sum + item.total_commission,
    0
  );

  return (
    <div className='space-y-8'>
      {/* Enhanced Header */}
      <PageHeader
        title={t('analytics.title')}
        subtitle={t('analytics.description')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Refresh Data
          </Button>
        }
      />

      {/* Date Range Info */}
      <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-4">
        <p className='text-sm text-blue-700 font-medium'>
          📅 Data from {analyticsData.date_range.start_date} to{' '}
          {analyticsData.date_range.end_date}
        </p>
      </div>

      {/* Summary Cards Section */}
      <Section title="Key Metrics" subtitle="Overview of your business performance">
        <CardGrid cols={4} gap="lg">
          <div className='stats-card card-hover'>
            <div className='stats-card-header'>
              <div className='w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center'>
                <DollarSign className='h-6 w-6 text-success-600' />
              </div>
            </div>
            <div className='stats-card-content'>
              <p className='text-sm font-medium text-gray-500'>{t('dashboard.total_revenue')}</p>
              <p className='text-2xl font-bold text-gray-900'>
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          <div className='stats-card card-hover'>
            <div className='stats-card-header'>
              <div className='w-12 h-12 bg-accent-50 rounded-lg flex items-center justify-center'>
                <TrendingUp className='h-6 w-6 text-accent-600' />
              </div>
            </div>
            <div className='stats-card-content'>
              <p className='text-sm font-medium text-gray-500'>
                {t('dashboard.total_commission')}
              </p>
              <p className='text-2xl font-bold text-gray-900'>
                {formatCurrency(totalCommission)}
              </p>
            </div>
          </div>

          <div className='stats-card card-hover'>
            <div className='stats-card-header'>
              <div className='w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center'>
                <Users className='h-6 w-6 text-warning-600' />
              </div>
            </div>
            <div className='stats-card-content'>
              <p className='text-sm font-medium text-gray-500'>{t('dashboard.active_clients')}</p>
              <p className='text-2xl font-bold text-gray-900'>
                {analyticsData.client_summary.length}
              </p>
            </div>
          </div>

          <div className='stats-card card-hover'>
            <div className='stats-card-header'>
              <div className='w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center'>
                <Activity className='h-6 w-6 text-gray-600' />
              </div>
            </div>
            <div className='stats-card-content'>
              <p className='text-sm font-medium text-gray-500'>
                {t('dashboard.total_transactions')}
              </p>
              <p className='text-2xl font-bold text-gray-900'>
                {analyticsData.psp_summary.reduce(
                  (sum, item) => sum + item.transaction_count,
                  0
                )}
              </p>
            </div>
          </div>
        </CardGrid>
      </Section>

      {/* Analytics Charts Section */}
      <Section title="Performance Analytics" subtitle="Detailed insights into your business metrics">
        <ContentArea>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* PSP Summary */}
            <div className='card'>
              <div className='px-6 py-4 border-b border-gray-100'>
                <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                  <PieChart className='h-5 w-5 mr-2' />
                  PSP Performance
                </h3>
                <p className='text-sm text-gray-600 mt-1'>
                  Revenue by Payment Service Provider
                </p>
              </div>
              <div className='p-6'>
                {analyticsData.psp_summary.length > 0 ? (
                  <div className='space-y-4'>
                    {analyticsData.psp_summary.map(psp => (
                      <div
                        key={psp.psp}
                        className='flex items-center justify-between'
                      >
                        <div className='flex-1'>
                          <div className='flex items-center justify-between mb-1'>
                            <span className='text-sm font-medium text-gray-900'>
                              {psp.psp}
                            </span>
                            <span className='text-sm text-gray-500'>
                              {formatCurrency(psp.total_amount)}
                            </span>
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-blue-600 h-2 rounded-full'
                              style={{
                                width: `${formatPercentage(psp.total_amount, totalAmount)}`,
                              }}
                            ></div>
                          </div>
                          <div className='flex justify-between text-xs text-gray-500 mt-1'>
                            <span>{psp.transaction_count} transactions</span>
                            <span>
                              {formatPercentage(psp.total_amount, totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <PieChart className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-500'>No PSP data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Summary */}
            <div className='card'>
              <div className='px-6 py-4 border-b border-gray-100'>
                <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                  <BarChart3 className='h-5 w-5 mr-2' />
                  Category Breakdown
                </h3>
                <p className='text-sm text-gray-600 mt-1'>
                  Revenue by transaction category
                </p>
              </div>
              <div className='p-6'>
                {analyticsData.category_summary.length > 0 ? (
                  <div className='space-y-4'>
                    {analyticsData.category_summary.map(category => (
                      <div
                        key={category.category}
                        className='flex items-center justify-between'
                      >
                        <div className='flex-1'>
                          <div className='flex items-center justify-between mb-1'>
                            <span className='text-sm font-medium text-gray-900'>
                              {category.category}
                            </span>
                            <span className='text-sm text-gray-500'>
                              {formatCurrency(category.total_amount)}
                            </span>
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-2'>
                            <div
                              className={`h-2 rounded-full ${
                                category.category === 'WD'
                                  ? 'bg-red-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${formatPercentage(category.total_amount, totalAmount)}`,
                              }}
                            ></div>
                          </div>
                          <div className='flex justify-between text-xs text-gray-500 mt-1'>
                            <span>{category.transaction_count} transactions</span>
                            <span>
                              {formatPercentage(category.total_amount, totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <BarChart3 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-500'>No category data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ContentArea>
      </Section>

      {/* Top Clients Section */}
      <Section title="Top Clients" subtitle="Clients with highest transaction volume">
        <div className='card'>
          <div className='p-6'>
            {analyticsData.client_summary.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Client
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Total Amount
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Commission
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Transactions
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Avg Transaction
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {analyticsData.client_summary
                      .slice(0, 10)
                      .map((client, index) => (
                        <tr key={client.client_name} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3'>
                                <span className='text-sm font-medium text-gray-900'>
                                  #{index + 1}
                                </span>
                              </div>
                              <div className='text-sm font-medium text-gray-900'>
                                {client.client_name}
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {formatCurrency(client.total_amount)}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {formatCurrency(client.total_commission)}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {client.transaction_count}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {formatCurrency(
                              client.total_amount / client.transaction_count
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='text-center py-8'>
                <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>No client data available</p>
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
