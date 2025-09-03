import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useTranslation } from '../contexts/TranslationContext'
import { 
  Plus, 
  Download, 
  Upload, 
  Settings, 
  FileText, 
  BarChart3,
  Users,
  Building,
  CreditCard,
  ArrowRightLeft,
  Calculator,
  Eye,
  Bell
} from 'lucide-react'

export function QuickActions() {
  const { t } = useTranslation()

  const primaryActions = [
    {
      label: t('transactions.addTransaction'),
      description: 'Create new transaction',
      icon: Plus,
      shortcut: 'Ctrl+N'
    },
    {
      label: t('transactions.import'),
      description: 'Import from file',
      icon: Upload,
      shortcut: 'Ctrl+I'
    }
  ]

  const secondaryActions = [
    {
      label: 'Export Data',
      icon: Download,
      shortcut: 'Ctrl+E'
    },
    {
      label: 'Generate Report',
      icon: FileText,
      shortcut: 'Ctrl+R'
    },
    {
      label: 'View Analytics',
      icon: BarChart3,
      shortcut: 'Ctrl+A'
    },
    {
      label: 'Client Manager',
      icon: Users,
      shortcut: 'Ctrl+U'
    },
    {
      label: 'PSP Settings',
      icon: Building,
      shortcut: 'Ctrl+P'
    },
    {
      label: 'Commission Calc',
      icon: Calculator,
      shortcut: 'Ctrl+C'
    }
  ]

  const quickStats = [
    {
      label: 'Pending Reviews',
      value: '12',
      icon: Eye
    },
    {
      label: 'Alerts',
      value: '3',
      icon: Bell
    },
    {
      label: 'Active PSPs',
      value: '5',
      icon: CreditCard
    }
  ]

  return (
    <Card className="border border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Frequently used actions and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Primary Actions */}
        <div className="space-y-3">
          <h4 className="text-sm text-muted-foreground">Primary Actions</h4>
          <div className="space-y-2">
            {primaryActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-auto p-4"
              >
                <div className="flex items-center gap-3 w-full">
                  <action.icon className="w-4 h-4" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {action.shortcut}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="space-y-3">
          <h4 className="text-sm text-muted-foreground">Secondary Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <action.icon className="w-4 h-4" />
                <div className="text-xs text-center">{action.label}</div>
                <Badge variant="outline" className="text-xs">
                  {action.shortcut}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3 pt-2 border-t border-border">
          <h4 className="text-sm text-muted-foreground">Quick Stats</h4>
          <div className="grid grid-cols-3 gap-3">
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className="p-3 border border-border rounded-md text-center space-y-1"
              >
                <stat.icon className="w-4 h-4 mx-auto" />
                <div className="text-lg font-medium">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}