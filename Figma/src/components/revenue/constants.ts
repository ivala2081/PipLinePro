// Enhanced Revenue Data with multi-dimensional analytics
export const monthlyRevenueData = [
  {
    month: 'Jan',
    date: '2024-01',
    totalRevenue: 2847500,
    netRevenue: 2650000,
    deposits: 3200000,
    withdrawals: 550000,
    commission: 197500,
    transactions: 1247,
    clients: 89,
    avgTransactionSize: 2564,
    commissionRate: 2.85,
    growth: 12.3,
    currencies: {
      TL: 1420000,
      USD: 956700,
      EUR: 470800
    },
    psps: {
      PayPal: 847500,
      Stripe: 692300,
      Iyzico: 578900,
      Square: 429800,
      Adyen: 299000
    }
  },
  {
    month: 'Feb',
    date: '2024-02',
    totalRevenue: 3156200,
    netRevenue: 2934500,
    deposits: 3580000,
    withdrawals: 645500,
    commission: 221700,
    transactions: 1389,
    clients: 94,
    avgTransactionSize: 2577,
    commissionRate: 2.91,
    growth: 10.8,
    currencies: {
      TL: 1578100,
      USD: 1067400,
      EUR: 510700
    },
    psps: {
      PayPal: 946900,
      Stripe: 756800,
      Iyzico: 631200,
      Square: 474600,
      Adyen: 346700
    }
  },
  {
    month: 'Mar',
    date: '2024-03',
    totalRevenue: 3687400,
    netRevenue: 3432100,
    deposits: 4200000,
    withdrawals: 767900,
    commission: 255300,
    transactions: 1634,
    clients: 103,
    avgTransactionSize: 2571,
    commissionRate: 2.88,
    growth: 16.8,
    currencies: {
      TL: 1843700,
      USD: 1243200,
      EUR: 600500
    },
    psps: {
      PayPal: 1106200,
      Stripe: 884800,
      Iyzico: 738600,
      Square: 553900,
      Adyen: 403900
    }
  },
  {
    month: 'Apr',
    date: '2024-04',
    totalRevenue: 4234800,
    netRevenue: 3939200,
    deposits: 4850000,
    withdrawals: 910800,
    commission: 295600,
    transactions: 1847,
    clients: 112,
    avgTransactionSize: 2625,
    commissionRate: 2.93,
    growth: 14.8,
    currencies: {
      TL: 2117400,
      USD: 1423200,
      EUR: 694200
    },
    psps: {
      PayPal: 1270400,
      Stripe: 1015900,
      Iyzico: 846900,
      Square: 635100,
      Adyen: 466500
    }
  },
  {
    month: 'May',
    date: '2024-05',
    totalRevenue: 3892100,
    netRevenue: 3622400,
    deposits: 4450000,
    withdrawals: 827600,
    commission: 269700,
    transactions: 1689,
    clients: 108,
    avgTransactionSize: 2635,
    commissionRate: 2.87,
    growth: -8.1,
    currencies: {
      TL: 1946050,
      USD: 1312000,
      EUR: 634050
    },
    psps: {
      PayPal: 1167600,
      Stripe: 934500,
      Iyzico: 778500,
      Square: 583800,
      Adyen: 427700
    }
  },
  {
    month: 'Jun',
    date: '2024-06',
    totalRevenue: 4567300,
    netRevenue: 4248900,
    deposits: 5200000,
    withdrawals: 951100,
    commission: 318400,
    transactions: 1976,
    clients: 118,
    avgTransactionSize: 2632,
    commissionRate: 2.95,
    growth: 17.3,
    currencies: {
      TL: 2283650,
      USD: 1536100,
      EUR: 747550
    },
    psps: {
      PayPal: 1370200,
      Stripe: 1096000,
      Iyzico: 914200,
      Square: 685500,
      Adyen: 501400
    }
  }
]

// Daily revenue data for recent performance
export const dailyRevenueData = [
  { date: '15/01', revenue: 156700, commission: 8900, transactions: 67, growth: 5.2 },
  { date: '16/01', revenue: 189300, commission: 10200, transactions: 78, growth: 20.8 },
  { date: '17/01', revenue: 234100, commission: 12800, transactions: 94, growth: 23.7 },
  { date: '18/01', revenue: 198500, commission: 11100, transactions: 82, growth: -15.2 },
  { date: '19/01', revenue: 267800, commission: 14600, transactions: 103, growth: 34.9 },
  { date: '20/01', revenue: 245600, commission: 13400, transactions: 96, growth: -8.3 },
  { date: '21/01', revenue: 298900, commission: 16200, transactions: 118, growth: 21.7 }
]

// Enhanced PSP performance colors
export const PSP_COLORS = {
  PayPal: '#0070f3',
  Stripe: '#635bff',
  Iyzico: '#00c896',
  Square: '#000000',
  Adyen: '#0abf53'
}