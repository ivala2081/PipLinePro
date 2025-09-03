import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'en' | 'tr' | 'de' | 'es' | 'fr'

interface TranslationContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  formatCurrency: (amount: number, currency?: string) => string
  formatDate: (date: string | Date) => string
  formatDateTime: (date: string | Date) => string
}

const translations = {
  en: {
    // Navigation & General
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.analytics': 'Analytics',
    'nav.ledger': 'Financial Ledger',
    'nav.clients': 'Client Management',
    'nav.settings': 'System Settings',
    'nav.logout': 'Sign Out',
    'nav.profile': 'Profile Settings',

    // Dashboard
    'dashboard.title': 'Treasury Dashboard',
    'dashboard.welcome': 'Welcome back, {{username}}. Here\'s your comprehensive financial overview and analytics.',
    'dashboard.systemOperational': 'System Operational',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.commission': 'Commission',
    'dashboard.transactions': 'Transactions',
    'dashboard.avgGrowth': 'Avg Growth',
    'dashboard.vsLastMonth': 'vs last month',
    'dashboard.avgSize': 'avg size',
    'dashboard.commissionRate': 'commission rate',
    'dashboard.revenueAnalytics': 'Advanced Revenue Analytics',
    'dashboard.revenueAnalyticsDesc': 'Comprehensive revenue insights with multi-dimensional analysis, PSP performance tracking, and growth trends',
    'dashboard.systemActivity': 'System Activity',
    'dashboard.systemActivityDesc': 'Recent system events and operational notifications',
    
    // Revenue specific
    'revenue.activeClients': 'Active Clients',
    'revenue.overview': 'Overview',
    'revenue.commission': 'Commission',

    // Login
    'login.systemTitle': 'Treasury Management System',
    'login.signIn': 'Sign In',
    'login.signInDescription': 'Enter credentials to access dashboard',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.usernamePlaceholder': 'Username',
    'login.passwordPlaceholder': 'Password',
    'login.usernameRequired': 'Username required',
    'login.passwordRequired': 'Password required',
    'login.usernameMinLength': 'Minimum 3 characters',
    'login.passwordMinLength': 'Minimum 6 characters',
    'login.rememberMe': 'Remember me',
    'login.signingIn': 'Signing In...',
    'login.welcomeBack': 'Welcome back to PipeLine Pro',
    'login.loginSuccessDesc': 'Welcome to Treasury Management System',
    'login.loginFailed': 'Login failed',
    'login.invalidCredentials': 'Invalid credentials',
    'login.accountLocked': 'Account locked',
    'login.accountLockedDesc': 'Account is locked for {{time}} more minutes',
    'login.accountLockedMessage': 'Account locked for {{minutes}}:{{seconds}} due to failed attempts',
    'login.tooManyAttempts': 'Too many failed login attempts',
    'login.accountUnlocked': 'Account has been unlocked',
    'login.attemptsRemaining': '{{attempts}} attempts remaining',
    'login.failedAttempts': '{{count}} failed attempts',
    'login.securityNotice': 'Secure access to financial data. All sessions are monitored and logged.',
    'login.passwordStrength': 'Password strength',
    'login.passwordWeak': 'Weak',
    'login.passwordFair': 'Fair',
    'login.passwordGood': 'Good',
    'login.passwordStrong': 'Strong',
    'login.capsLockOn': 'Caps Lock is on',
    'login.online': 'Online',
    'login.offline': 'Offline',
    'login.offlineMode': 'You are currently offline. Some features may be limited.',
    'login.systemOperational': 'System Operational',
    'login.systemMaintenance': 'System Maintenance',
    'login.systemIssues': 'System Issues',
    'login.showAdvanced': 'Show Advanced Options',
    'login.hideAdvanced': 'Hide Advanced Options',
    'login.advancedOptions': 'Advanced Options',
    'login.twoFactorAuth': 'Two-Factor Authentication',
    'login.notConfigured': 'Not configured',
    'login.sessionDuration': 'Session Duration',
    'login.hours': 'hours',
    'login.demoCredentials': 'Demo Credentials',
    'login.recentActivity': 'Recent Activity',
    'login.success': 'Success',
    'login.failed': 'Failed',
    'login.allRightsReserved': 'All rights reserved',
    'login.secureTreasuryManagement': 'Secure Treasury Management Solution',
    'login.encryptedConnection': 'Encrypted Connection',

    // Settings
    'settings.title': 'System Settings',
    'settings.subtitle': 'Configure system preferences, security settings, and administrative controls',
    'settings.general': 'General',
    'settings.security': 'Security',
    'settings.notifications': 'Notifications',
    'settings.integrations': 'Integrations',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.lightMode': 'Light Mode',
    'settings.darkMode': 'Dark Mode',
    'settings.systemDefault': 'System Default',
    'settings.selectLanguage': 'Select Language',
    'settings.english': 'English',
    'settings.turkish': 'Türkçe',
    'settings.german': 'Deutsch',
    'settings.spanish': 'Español',
    'settings.french': 'Français',
    'settings.timezone': 'Timezone',
    'settings.dateFormat': 'Date Format',
    'settings.currencyDisplay': 'Currency Display',
    'settings.save': 'Save Settings',
    'settings.cancel': 'Cancel',
    'settings.saved': 'Settings saved successfully',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.add': 'Add',
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.refresh': 'Refresh',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.all': 'All',
    'common.none': 'None',
    'common.select': 'Select',
    'common.optional': 'Optional',
    'common.required': 'Required',
    'common.today': 'Today',
    'common.yesterday': 'Yesterday',
    'common.thisWeek': 'This Week',
    'common.thisMonth': 'This Month',
    'common.thisYear': 'This Year',
    'common.custom': 'Custom',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.maintenance': 'Maintenance',
    'common.offline': 'Offline',
    'common.performance': 'Performance',
    'common.clients': 'clients',
    'common.totalRevenue': 'Total Revenue',
    'common.totalCommission': 'Total Commission',
    'common.totalTransactions': 'Total Transactions',
    'common.totalClients': 'Total Clients',
    'common.totalVolume': 'Total Volume',
    'common.averageRate': 'Average Rate',
    'common.exchangeRates': 'Exchange Rates',
    'common.realTimeRates': 'Real-time currency exchange rates',
    'common.lastUpdated': 'Last updated',
    'common.recentActivity': 'Recent transaction activity and status updates',
    'common.viewAll': 'View All',
    'common.totalDeposits': 'Total Deposits',
    'common.totalWithdrawals': 'Total Withdrawals',
    'common.volumeShare': 'Volume Share',
    
    // Transactions
    'transactions.completed': 'Completed',
    'transactions.pending': 'Pending',
    'transactions.failed': 'Failed',
    'transactions.deposit': 'Deposit',
    'transactions.withdrawal': 'Withdrawal',
    'transactions.commission': 'Commission',
    'transactions.pspPerformance': 'PSP Performance',
    'transactions.pspPerformanceDesc': 'Performance metrics and analytics for payment service providers',
    'transactions.marketShare': 'market share',
    'transactions.transactions': 'Transactions',
    'transactions.totalTransactions': 'Total Transactions'
  },
  tr: {
    // Navigasyon ve Genel
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'İşlemler',
    'nav.analytics': 'Analitik',
    'nav.ledger': 'Mali Defter',
    'nav.clients': 'Müşteri Yönetimi',
    'nav.settings': 'Sistem Ayarları',
    'nav.logout': 'Çıkış Yap',
    'nav.profile': 'Profil Ayarları',

    // Kontrol Paneli
    'dashboard.title': 'Hazine Kontrol Paneli',
    'dashboard.welcome': 'Tekrar hoş geldiniz, {{username}}. İşte kapsamlı mali görünümünüz ve analitiğiniz.',
    'dashboard.systemOperational': 'Sistem Operasyonel',
    'dashboard.totalRevenue': 'Toplam Gelir',
    'dashboard.commission': 'Komisyon',
    'dashboard.transactions': 'İşlemler',
    'dashboard.avgGrowth': 'Ortalama Büyüme',
    'dashboard.vsLastMonth': 'geçen aya göre',
    'dashboard.avgSize': 'ortalama boyut',
    'dashboard.commissionRate': 'komisyon oranı',
    'dashboard.revenueAnalytics': 'Gelişmiş Gelir Analitiği',
    'dashboard.revenueAnalyticsDesc': 'Çok boyutlu analiz, PSP performans takibi ve büyüme trendleri ile kapsamlı gelir görünümleri',
    'dashboard.systemActivity': 'Sistem Etkinliği',
    'dashboard.systemActivityDesc': 'Son sistem olayları ve operasyonel bildirimler',
    
    // Gelir spesifik
    'revenue.activeClients': 'Aktif Müşteriler',
    'revenue.overview': 'Genel Bakış',
    'revenue.commission': 'Komisyon',

    // Giriş
    'login.systemTitle': 'Hazine Yönetim Sistemi',
    'login.signIn': 'Giriş Yap',
    'login.signInDescription': 'Panele erişmek için kimlik bilgilerinizi girin',
    'login.username': 'Kullanıcı Adı',
    'login.password': 'Şifre',
    'login.usernamePlaceholder': 'Kullanıcı Adı',
    'login.passwordPlaceholder': 'Şifre',
    'login.usernameRequired': 'Kullanıcı adı gerekli',
    'login.passwordRequired': 'Şifre gerekli',
    'login.usernameMinLength': 'En az 3 karakter',
    'login.passwordMinLength': 'En az 6 karakter',
    'login.rememberMe': 'Beni hatırla',
    'login.signingIn': 'Giriş yapılıyor...',
    'login.welcomeBack': 'PipeLine Pro\'ya tekrar hoş geldiniz',
    'login.loginSuccessDesc': 'Hazine Yönetim Sistemine hoş geldiniz',
    'login.loginFailed': 'Giriş başarısız',
    'login.invalidCredentials': 'Geçersiz kimlik bilgileri',
    'login.accountLocked': 'Hesap kilitli',
    'login.accountLockedDesc': 'Hesap {{time}} dakika daha kilitli',
    'login.accountLockedMessage': 'Başarısız denemeler nedeniyle hesap {{minutes}}:{{seconds}} süre kilitli',
    'login.tooManyAttempts': 'Çok fazla başarısız giriş denemesi',
    'login.accountUnlocked': 'Hesap kilidi açıldı',
    'login.attemptsRemaining': '{{attempts}} deneme hakkı kaldı',
    'login.failedAttempts': '{{count}} başarısız deneme',
    'login.securityNotice': 'Mali verilere güvenli erişim. Tüm oturumlar izlenir ve kaydedilir.',
    'login.passwordStrength': 'Şifre gücü',
    'login.passwordWeak': 'Zayıf',
    'login.passwordFair': 'Orta',
    'login.passwordGood': 'İyi',
    'login.passwordStrong': 'Güçlü',
    'login.capsLockOn': 'Caps Lock açık',
    'login.online': 'Çevrimiçi',
    'login.offline': 'Çevrimdışı',
    'login.offlineMode': 'Şu anda çevrimdışısınız. Bazı özellikler sınırlı olabilir.',
    'login.systemOperational': 'Sistem Operasyonel',
    'login.systemMaintenance': 'Sistem Bakımda',
    'login.systemIssues': 'Sistem Sorunları',
    'login.showAdvanced': 'Gelişmiş Seçenekleri Göster',
    'login.hideAdvanced': 'Gelişmiş Seçenekleri Gizle',
    'login.advancedOptions': 'Gelişmiş Seçenekler',
    'login.twoFactorAuth': 'İki Faktörlü Kimlik Doğrulama',
    'login.notConfigured': 'Yapılandırılmamış',
    'login.sessionDuration': 'Oturum Süresi',
    'login.hours': 'saat',
    'login.demoCredentials': 'Demo Kimlik Bilgileri',
    'login.recentActivity': 'Son Etkinlik',
    'login.success': 'Başarılı',
    'login.failed': 'Başarısız',
    'login.allRightsReserved': 'Tüm hakları saklıdır.',
    'login.secureTreasuryManagement': 'Güvenli Hazine Yönetim Çözümü',
    'login.encryptedConnection': 'Şifreli Bağlantı',

    // Ayarlar
    'settings.title': 'Sistem Ayarları',
    'settings.subtitle': 'Sistem tercihlerini, güvenlik ayarlarını ve yönetim kontrollerini yapılandırın',
    'settings.general': 'Genel',
    'settings.security': 'Güvenlik',
    'settings.notifications': 'Bildirimler',
    'settings.integrations': 'Entegrasyonlar',
    'settings.language': 'Dil',
    'settings.theme': 'Tema',
    'settings.lightMode': 'Açık Mod',
    'settings.darkMode': 'Koyu Mod',
    'settings.systemDefault': 'Sistem Varsayılanı',
    'settings.selectLanguage': 'Dil Seç',
    'settings.english': 'English',
    'settings.turkish': 'Türkçe',
    'settings.german': 'Deutsch',
    'settings.spanish': 'Español',
    'settings.french': 'Français',
    'settings.timezone': 'Saat Dilimi',
    'settings.dateFormat': 'Tarih Formatı',
    'settings.currencyDisplay': 'Para Birimi Görünümü',
    'settings.save': 'Ayarları Kaydet',
    'settings.cancel': 'İptal',
    'settings.saved': 'Ayarlar başarıyla kaydedildi',

    // Ortak
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.cancel': 'İptal',
    'common.save': 'Kaydet',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.view': 'Görüntüle',
    'common.add': 'Ekle',
    'common.search': 'Ara...',
    'common.filter': 'Filtrele',
    'common.export': 'Dışa Aktar',
    'common.import': 'İçe Aktar',
    'common.refresh': 'Yenile',
    'common.close': 'Kapat',
    'common.confirm': 'Onayla',
    'common.yes': 'Evet',
    'common.no': 'Hayır',
    'common.all': 'Tümü',
    'common.none': 'Hiçbiri',
    'common.select': 'Seç',
    'common.optional': 'Opsiyonel',
    'common.required': 'Gerekli',
    'common.today': 'Bugün',
    'common.yesterday': 'Dün',
    'common.thisWeek': 'Bu Hafta',
    'common.thisMonth': 'Bu Ay',
    'common.thisYear': 'Bu Yıl',
    'common.custom': 'Özel',
    'common.active': 'Aktif',
    'common.inactive': 'Pasif',
    'common.maintenance': 'Bakım',
    'common.offline': 'Çevrimdışı',
    'common.performance': 'Performans',
    'common.clients': 'müşteri',
    'common.totalRevenue': 'Toplam Gelir',
    'common.totalCommission': 'Toplam Komisyon',
    'common.totalTransactions': 'Toplam İşlemler',
    'common.totalClients': 'Toplam Müşteriler',
    'common.totalVolume': 'Toplam Hacim',
    'common.averageRate': 'Ortalama Oran',
    'common.exchangeRates': 'Döviz Kurları',
    'common.realTimeRates': 'Gerçek zamanlı döviz kurları',
    'common.lastUpdated': 'Son güncelleme',
    'common.recentActivity': 'Son işlem etkinliği ve durum güncellemeleri',
    'common.viewAll': 'Tümünü Görüntüle',
    'common.totalDeposits': 'Toplam Yatırımlar',
    'common.totalWithdrawals': 'Toplam Para Çekme',
    'common.volumeShare': 'Hacim Payı',
    
    // İşlemler
    'transactions.completed': 'Tamamlandı',
    'transactions.pending': 'Beklemede',
    'transactions.failed': 'Başarısız',
    'transactions.deposit': 'Yatırım',
    'transactions.withdrawal': 'Para Çekme',
    'transactions.commission': 'Komisyon',
    'transactions.pspPerformance': 'PSP Performansı',
    'transactions.pspPerformanceDesc': 'Ödeme hizmet sağlayıcıları için performans metrikleri ve analitikleri',
    'transactions.marketShare': 'pazar payı',
    'transactions.transactions': 'İşlemler',
    'transactions.totalTransactions': 'Toplam İşlemler'
  }
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('pipeline-pro-language')
    return (stored as Language) || 'en'
  })

  useEffect(() => {
    localStorage.setItem('pipeline-pro-language', language)
  }, [language])

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  const formatCurrency = (amount: number, currency: string = 'TRY'): string => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US'
    
    // Map common currency codes to valid ISO codes
    const currencyMap: { [key: string]: string } = {
      'TL': 'TRY',
      'TRY': 'TRY',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP'
    }
    
    const validCurrency = currencyMap[currency] || 'TRY'
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const locale = language === 'tr' ? 'tr-TR' : 'en-US'
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj)
  }

  const formatDateTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const locale = language === 'tr' ? 'tr-TR' : 'en-US'
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  return (
    <TranslationContext.Provider value={{
      language,
      setLanguage,
      t,
      formatCurrency,
      formatDate,
      formatDateTime
    }}>
      {children}
    </TranslationContext.Provider>
  )
}