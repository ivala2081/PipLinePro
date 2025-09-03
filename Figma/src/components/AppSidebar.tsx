import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/TranslationContext'
import { PageType } from './Router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter
} from './ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import {
  LayoutDashboard,
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Users,
  Settings,
  Building,
  Shield,
  ChevronsUpDown,
  LogOut
} from 'lucide-react'

interface AppSidebarProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
}

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const navigation = [
    {
      title: t('nav.dashboard'),
      icon: LayoutDashboard,
      page: 'dashboard' as PageType,
      badge: null
    },
    {
      title: t('nav.transactions'),
      icon: ArrowRightLeft,
      page: 'transactions' as PageType,
      badge: '156'
    },
    {
      title: t('nav.analytics'),
      icon: BarChart3,
      page: 'analytics' as PageType,
      badge: null
    },
    {
      title: t('nav.ledger'),
      icon: BookOpen,
      page: 'ledger' as PageType,
      badge: null
    },
    {
      title: t('nav.clients'),
      icon: Users,
      page: 'clients' as PageType,
      badge: '24'
    },
    {
      title: t('nav.settings'),
      icon: Settings,
      page: 'settings' as PageType,
      badge: null
    }
  ]

  const getRoleIcon = (adminLevel: number) => {
    switch (adminLevel) {
      case 4: return <Shield className="w-3 h-3" />
      case 3: return <Building className="w-3 h-3" />
      default: return null
    }
  }

  const getRoleName = (role: string, adminLevel: number) => {
    switch (adminLevel) {
      case 4: return 'Hard Admin'
      case 3: return 'Main Admin'
      case 2: return 'Secondary Admin'
      case 1: return 'Sub Admin'
      default: return role
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PP</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">PipeLine Pro</span>
            <span className="text-xs text-muted-foreground">Treasury Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => onPageChange(item.page)}
                    className="flex items-center gap-3"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar} alt={user?.username} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.username}</span>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(user?.adminLevel || 0)}
                      <span className="truncate text-xs text-muted-foreground">
                        {getRoleName(user?.role || '', user?.adminLevel || 0)}
                      </span>
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => onPageChange('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('nav.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}