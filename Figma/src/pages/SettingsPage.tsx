import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Separator } from '../components/ui/separator'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { LanguageSelector } from '../components/LanguageSelector'
import { ThemeSelector } from '../components/ThemeSelector'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useTheme } from '../contexts/ThemeContext'
import { usePSP } from '../contexts/PSPContext'
import { toast } from 'sonner@2.0.3'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Database,
  Key,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Percent
} from 'lucide-react'

export default function SettingsPage() {
  const { user, hasPermission } = useAuth()
  const { t, language } = useTranslation()
  const { theme, actualTheme } = useTheme()
  const { psps, addPsp, updatePsp, removePsp, togglePspStatus } = usePSP()
  const [isLoading, setIsLoading] = useState(false)
  
  const [settings, setSettings] = useState({
    // General Settings
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currencyDisplay: 'symbol',
    defaultCurrency: 'TRY',
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    transactionAlerts: true,
    dailyReports: true,
    weeklyReports: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    
    // System Settings
    autoBackup: true,
    auditLogging: true,
    performanceMonitoring: true
  })

  // PSP Management State
  const [isAddPspOpen, setIsAddPspOpen] = useState(false)
  const [isEditPspOpen, setIsEditPspOpen] = useState(false)
  const [selectedPsp, setSelectedPsp] = useState<null | typeof psps[0]>(null)
  const [pspForm, setPspForm] = useState({
    name: '',
    commissionRate: 0
  })

  const canModifySettings = hasPermission('settings.modify') || hasPermission('*')
  const canViewSecurity = hasPermission('settings.security') || hasPermission('*')
  const canManageIntegrations = hasPermission('settings.integrations') || hasPermission('*')
  const canManagePsps = hasPermission('settings.psps') || hasPermission('*')

  const handleSaveSettings = async () => {
    if (!canModifySettings) {
      toast.error('Permission Denied', {
        description: 'You do not have permission to modify settings'
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(t('settings.saved'), {
        description: 'Settings have been updated successfully'
      })
    } catch (error) {
      toast.error(t('common.error'), {
        description: 'Failed to save settings'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // PSP Management Functions
  const handleAddPsp = () => {
    if (!canManagePsps) {
      toast.error('Permission Denied', {
        description: 'You cannot manage PSP settings'
      })
      return
    }

    if (!pspForm.name.trim()) {
      toast.error('Validation Error', {
        description: 'PSP name is required'
      })
      return
    }

    if (pspForm.commissionRate < 0 || pspForm.commissionRate > 100) {
      toast.error('Validation Error', {
        description: 'Commission rate must be between 0% and 100%'
      })
      return
    }

    const newPspData = {
      name: pspForm.name.trim(),
      commissionRate: pspForm.commissionRate / 100, // Convert percentage to decimal
      isActive: true
    }

    addPsp(newPspData)
    setPspForm({ name: '', commissionRate: 0 })
    setIsAddPspOpen(false)
    
    toast.success('PSP Added', {
      description: `${newPspData.name} has been added with ${pspForm.commissionRate}% commission rate`
    })
  }

  const handleEditPsp = () => {
    if (!selectedPsp || !canManagePsps) return

    if (!pspForm.name.trim()) {
      toast.error('Validation Error', {
        description: 'PSP name is required'
      })
      return
    }

    if (pspForm.commissionRate < 0 || pspForm.commissionRate > 100) {
      toast.error('Validation Error', {
        description: 'Commission rate must be between 0% and 100%'
      })
      return
    }

    updatePsp(selectedPsp.id, {
      name: pspForm.name.trim(),
      commissionRate: pspForm.commissionRate / 100
    })

    setIsEditPspOpen(false)
    setSelectedPsp(null)
    setPspForm({ name: '', commissionRate: 0 })
    
    toast.success('PSP Updated', {
      description: `${pspForm.name} has been updated successfully`
    })
  }

  const handleDeletePsp = (pspId: string) => {
    if (!canManagePsps) {
      toast.error('Permission Denied', {
        description: 'You cannot manage PSP settings'
      })
      return
    }

    const pspToDelete = psps.find(p => p.id === pspId)
    if (!pspToDelete) return

    removePsp(pspId)
    
    toast.success('PSP Removed', {
      description: `${pspToDelete.name} has been removed from the system`
    })
  }

  const handleTogglePspStatus = (pspId: string) => {
    if (!canManagePsps) {
      toast.error('Permission Denied', {
        description: 'You cannot manage PSP settings'
      })
      return
    }

    const psp = psps.find(p => p.id === pspId)
    if (psp) {
      togglePspStatus(pspId)
      
      toast.success('PSP Status Updated', {
        description: `${psp.name} is now ${psp.isActive ? 'inactive' : 'active'}`
      })
    }
  }

  const openEditDialog = (psp: typeof psps[0]) => {
    setSelectedPsp(psp)
    setPspForm({
      name: psp.name,
      commissionRate: psp.commissionRate * 100 // Convert decimal to percentage
    })
    setIsEditPspOpen(true)
  }

  const timezones = [
    { value: 'Europe/Istanbul', label: 'Istanbul (GMT+3)' },
    { value: 'Europe/London', label: 'London (GMT+0)' },
    { value: 'Europe/Berlin', label: 'Berlin (GMT+1)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (GMT+8)' }
  ]

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: '15/01/2024' },
    { value: 'MM/DD/YYYY', label: '01/15/2024' },
    { value: 'YYYY-MM-DD', label: '2024-01-15' },
    { value: 'DD MMM YYYY', label: '15 Jan 2024' }
  ]

  const currencies = [
    { value: 'TRY', label: 'Turkish Lira (₺)', symbol: '₺' },
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' }
  ]

  return (
    <main className="flex-1 p-6 space-y-6 bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>{t('settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            v2-1-0
          </Badge>
          <Button onClick={handleSaveSettings} disabled={isLoading || !canModifySettings}>
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('settings.save')}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="psps">PSP Management</TabsTrigger>
          <TabsTrigger value="integrations">{t('settings.integrations')}</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language and Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language and Theme
                </CardTitle>
                <CardDescription>
                  Customize your language and visual preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('settings.language')}</Label>
                  <LanguageSelector />
                  <p className="text-xs text-muted-foreground">
                    Application language for all text and labels
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>{t('settings.theme')}</Label>
                  <ThemeSelector />
                  <p className="text-xs text-muted-foreground">
                    Choose between light, dark, or system default theme
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Current theme: <strong>{actualTheme}</strong> | 
                    Selected language: <strong>{language.toUpperCase()}</strong>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Regional Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Regional Settings
                </CardTitle>
                <CardDescription>
                  Configure timezone, date format, and currency preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('settings.timezone')}</Label>
                  <Select 
                    value={settings.timezone} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.dateFormat')}</Label>
                  <Select 
                    value={settings.dateFormat} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, dateFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select 
                    value={settings.timeFormat} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, timeFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour (2:30 PM)</SelectItem>
                      <SelectItem value="24h">24 Hour (14:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select 
                    value={settings.defaultCurrency} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, defaultCurrency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{currency.symbol}</span>
                            <span>{currency.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* User Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={user?.username || ''} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user?.role || ''} disabled />
                  <p className="text-xs text-muted-foreground">
                    Admin Level: {user?.adminLevel || 0}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    placeholder="user@example.com"
                    disabled={!canModifySettings}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    type="tel" 
                    placeholder="+90 555 123 4567"
                    disabled={!canModifySettings}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Information
                </CardTitle>
                <CardDescription>
                  Current system status and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Version</p>
                    <p className="font-medium">v2-1-0</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Environment</p>
                    <p className="font-medium">Production</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Database</p>
                    <p className="font-medium">Connected</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Backup</p>
                    <p className="font-medium">2 hours ago</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="font-medium">15 days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active Users</p>
                    <p className="font-medium">12</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Backup</span>
                    <Switch 
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                      disabled={!canModifySettings}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audit Logging</span>
                    <Switch 
                      checked={settings.auditLogging}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auditLogging: checked }))}
                      disabled={!canModifySettings}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance Monitoring</span>
                    <Switch 
                      checked={settings.performanceMonitoring}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, performanceMonitoring: checked }))}
                      disabled={!canModifySettings}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          {canViewSecurity ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Configure authentication and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch 
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                      disabled={!canModifySettings}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Select 
                      value={settings.sessionTimeout.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(value) }))}
                      disabled={!canModifySettings}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Password Expiry (days)</Label>
                    <Select 
                      value={settings.passwordExpiry.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, passwordExpiry: parseInt(value) }))}
                      disabled={!canModifySettings}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Access Control
                  </CardTitle>
                  <CardDescription>
                    Current permissions and access levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Admin Level</span>
                      <Badge variant="outline">{user?.adminLevel || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Role</span>
                      <Badge>{user?.role}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Permissions</span>
                      <Badge variant="secondary">{user?.permissions?.length || 0}</Badge>
                    </div>
                  </div>

                  {user?.adminLevel && user.adminLevel >= 3 && (
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        You have administrative privileges with full system access
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">
                    You do not have permission to view security settings
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    disabled={!canModifySettings}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Critical alerts via SMS</p>
                  </div>
                  <Switch 
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
                    disabled={!canModifySettings}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    disabled={!canModifySettings}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Transaction Alerts</p>
                    <p className="text-xs text-muted-foreground">Notifications for transaction events</p>
                  </div>
                  <Switch 
                    checked={settings.transactionAlerts}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, transactionAlerts: checked }))}
                    disabled={!canModifySettings}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Daily Reports</p>
                    <p className="text-xs text-muted-foreground">Daily financial summaries</p>
                  </div>
                  <Switch 
                    checked={settings.dailyReports}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, dailyReports: checked }))}
                    disabled={!canModifySettings}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Weekly Reports</p>
                    <p className="text-xs text-muted-foreground">Weekly analytics reports</p>
                  </div>
                  <Switch 
                    checked={settings.weeklyReports}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weeklyReports: checked }))}
                    disabled={!canModifySettings}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PSP Management */}
        <TabsContent value="psps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                PSP Management
              </CardTitle>
              <CardDescription>
                Manage payment service providers and their commission rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Payment Service Providers</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure PSPs and their commission structures
                  </p>
                </div>
                <Dialog open={isAddPspOpen} onOpenChange={setIsAddPspOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!canManagePsps}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add PSP
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New PSP</DialogTitle>
                      <DialogDescription>
                        Add a new payment service provider to the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="psp-name">PSP Name</Label>
                        <Input
                          id="psp-name"
                          value={pspForm.name}
                          onChange={(e) => setPspForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter PSP name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="commission-rate"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={pspForm.commissionRate}
                            onChange={(e) => setPspForm(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.0"
                          />
                          <Percent className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddPspOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPsp}>
                        Add PSP
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PSP Name</TableHead>
                      <TableHead>Commission Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {psps.map((psp) => (
                      <TableRow key={psp.id}>
                        <TableCell className="font-medium">{psp.name}</TableCell>
                        <TableCell>{(psp.commissionRate * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant={psp.isActive ? "default" : "secondary"}>
                            {psp.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(psp)}
                            disabled={!canManagePsps}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePspStatus(psp.id)}
                            disabled={!canManagePsps}
                          >
                            {psp.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePsp(psp.id)}
                            disabled={!canManagePsps}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Edit PSP Dialog */}
              <Dialog open={isEditPspOpen} onOpenChange={setIsEditPspOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit PSP</DialogTitle>
                    <DialogDescription>
                      Update PSP information and commission rate
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-psp-name">PSP Name</Label>
                      <Input
                        id="edit-psp-name"
                        value={pspForm.name}
                        onChange={(e) => setPspForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter PSP name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-commission-rate">Commission Rate (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="edit-commission-rate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={pspForm.commissionRate}
                          onChange={(e) => setPspForm(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.0"
                        />
                        <Percent className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditPspOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditPsp}>
                      Update PSP
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                {t('settings.integrations')}
              </CardTitle>
              <CardDescription>
                Configure external integrations and API connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Integration settings are only available to administrators with appropriate permissions
                </AlertDescription>
              </Alert>
              
              {canManageIntegrations ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">Integration settings will be available here</p>
                </div>
              ) : (
                <div className="text-center p-8">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">
                    You do not have permission to manage integrations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}