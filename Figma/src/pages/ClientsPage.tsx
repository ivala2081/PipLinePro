import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Checkbox } from '../components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner@2.0.3'
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Crown,
  Star,
  Circle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  segment: 'VIP' | 'Premium' | 'Regular' | 'Standard'
  totalVolume: number
  transactionCount: number
  avgTransactionSize: number
  lastTransaction: string
  registrationDate: string
  status: 'active' | 'inactive' | 'suspended'
  notes: string
  preferredCurrency: 'TRY' | 'USD' | 'EUR'
  preferredPSP: string
}

const mockClients: Client[] = [
  {
    id: 'CL-001',
    name: 'John Smith',
    email: 'john.smith@acmecorp.com',
    phone: '+90 555 123 4567',
    company: 'Acme Corporation',
    segment: 'VIP',
    totalVolume: 1250000,
    transactionCount: 45,
    avgTransactionSize: 27777,
    lastTransaction: '2024-01-15T10:30:00Z',
    registrationDate: '2023-06-15T00:00:00Z',
    status: 'active',
    notes: 'High-value client with consistent monthly transactions',
    preferredCurrency: 'USD',
    preferredPSP: 'PayPal'
  },
  {
    id: 'CL-002',
    name: 'Sarah Johnson',
    email: 'sarah.j@techsolutions.com',
    phone: '+90 555 987 6543',
    company: 'Tech Solutions Ltd',
    segment: 'Premium',
    totalVolume: 890000,
    transactionCount: 32,
    avgTransactionSize: 27812,
    lastTransaction: '2024-01-14T16:45:00Z',
    registrationDate: '2023-08-22T00:00:00Z',
    status: 'active',
    notes: 'Growing business with increasing transaction frequency',
    preferredCurrency: 'EUR',
    preferredPSP: 'Stripe'
  },
  {
    id: 'CL-003',
    name: 'Michael Brown',
    email: 'michael.brown@globaltrading.com',
    phone: '+90 555 456 7890',
    company: 'Global Trading Inc',
    segment: 'VIP',
    totalVolume: 1850000,
    transactionCount: 67,
    avgTransactionSize: 27611,
    lastTransaction: '2024-01-15T08:20:00Z',
    registrationDate: '2023-03-10T00:00:00Z',
    status: 'active',
    notes: 'Largest client by volume, requires priority support',
    preferredCurrency: 'TRY',
    preferredPSP: 'Iyzico'
  },
  {
    id: 'CL-004',
    name: 'Emily Davis',
    email: 'emily.davis@finance.com',
    phone: '+90 555 321 0987',
    company: 'Finance Group',
    segment: 'Regular',
    totalVolume: 420000,
    transactionCount: 18,
    avgTransactionSize: 23333,
    lastTransaction: '2024-01-13T11:30:00Z',
    registrationDate: '2023-11-05T00:00:00Z',
    status: 'active',
    notes: 'New client with potential for growth',
    preferredCurrency: 'USD',
    preferredPSP: 'Square'
  }
]

export default function ClientsPage() {
  const { user, hasPermission } = useAuth()
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({
    segment: 'all',
    status: 'all',
    currency: 'all',
    psp: 'all'
  })

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    preferredCurrency: 'TRY' as 'TRY' | 'USD' | 'EUR',
    preferredPSP: '',
    notes: ''
  })

  const canCreate = hasPermission('clients.create') || hasPermission('*')
  const canUpdate = hasPermission('clients.update') || hasPermission('*')
  const canDelete = hasPermission('clients.delete') || hasPermission('*')

  const formatCurrency = (amount: number): string => {
    return `₺${amount.toLocaleString()}`
  }

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'VIP': return <Crown className="w-4 h-4 text-purple-600" />
      case 'Premium': return <Star className="w-4 h-4 text-amber-600" />
      case 'Regular': return <Users className="w-4 h-4 text-blue-600" />
      case 'Standard': return <Circle className="w-4 h-4 text-gray-600" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">VIP</Badge>
      case 'Premium':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Premium</Badge>
      case 'Regular':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Regular</Badge>
      case 'Standard':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Standard</Badge>
      default:
        return <Badge variant="outline">{segment}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSegment = filters.segment === 'all' || client.segment === filters.segment
    const matchesStatus = filters.status === 'all' || client.status === filters.status
    const matchesCurrency = filters.currency === 'all' || client.preferredCurrency === filters.currency
    const matchesPsp = filters.psp === 'all' || client.preferredPSP === filters.psp

    return matchesSearch && matchesSegment && matchesStatus && matchesCurrency && matchesPsp
  })

  const handleAddClient = () => {
    if (!canCreate) {
      toast.error('Permission denied', { description: 'You do not have permission to create clients' })
      return
    }

    if (!newClient.name || !newClient.email || !newClient.company) {
      toast.error('Missing required fields', { description: 'Please fill in all required fields' })
      return
    }

    const client: Client = {
      id: `CL-${Date.now()}`,
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      company: newClient.company,
      segment: 'Standard',
      totalVolume: 0,
      transactionCount: 0,
      avgTransactionSize: 0,
      lastTransaction: '',
      registrationDate: new Date().toISOString(),
      status: 'active',
      notes: newClient.notes,
      preferredCurrency: newClient.preferredCurrency,
      preferredPSP: newClient.preferredPSP
    }

    setClients(prev => [client, ...prev])
    setIsAddDialogOpen(false)
    setNewClient({
      name: '',
      email: '',
      phone: '',
      company: '',
      preferredCurrency: 'TRY',
      preferredPSP: '',
      notes: ''
    })

    toast.success('Client added', {
      description: `${client.name} has been added to the system`
    })
  }

  const handleDeleteClient = (id: string) => {
    if (!canDelete) {
      toast.error('Permission denied', { description: 'You do not have permission to delete clients' })
      return
    }

    setClients(prev => prev.filter(c => c.id !== id))
    toast.success('Client deleted', { description: 'Client has been removed from the system' })
  }

  const toggleClientSelection = (id: string) => {
    setSelectedClients(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    setSelectedClients(
      selectedClients.length === filteredClients.length 
        ? [] 
        : filteredClients.map(c => c.id)
    )
  }

  // Calculate summary stats
  const totalClients = clients.length
  const activeClients = clients.filter(c => c.status === 'active').length
  const totalVolume = clients.reduce((sum, c) => sum + c.totalVolume, 0)
  const avgClientValue = totalVolume / totalClients

  return (
    <main className="flex-1 p-6 space-y-6 bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Client Management</h1>
          <p className="text-muted-foreground">
            Comprehensive client relationship management and performance tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canCreate && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Create a new client record with contact and preference information
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newClient.name}
                      onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+90 555 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                      id="company"
                      value={newClient.company}
                      onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Preferred Currency</Label>
                    <Select 
                      value={newClient.preferredCurrency} 
                      onValueChange={(value: 'TRY' | 'USD' | 'EUR') => 
                        setNewClient(prev => ({ ...prev, preferredCurrency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">Turkish Lira (₺)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="psp">Preferred PSP</Label>
                    <Select 
                      value={newClient.preferredPSP} 
                      onValueChange={(value) => setNewClient(prev => ({ ...prev, preferredPSP: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select PSP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PayPal">PayPal</SelectItem>
                        <SelectItem value="Stripe">Stripe</SelectItem>
                        <SelectItem value="Iyzico">Iyzico</SelectItem>
                        <SelectItem value="Square">Square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newClient.notes}
                      onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any additional notes about the client..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddClient}>
                    Add Client
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{totalClients}</p>
                <p className="text-sm text-muted-foreground">{activeClients} active</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(totalVolume)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Client Value</p>
                <p className="text-2xl font-bold">{formatCurrency(avgClientValue)}</p>
                <p className="text-sm text-muted-foreground">per client</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">VIP Clients</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.segment === 'VIP').length}</p>
                <p className="text-sm text-muted-foreground">high-value clients</p>
              </div>
              <Crown className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Client Overview</TabsTrigger>
          <TabsTrigger value="segments">Segmentation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by name, company, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={filters.segment} onValueChange={(value) => setFilters(prev => ({ ...prev, segment: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedClients.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {selectedClients.length} client(s) selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedClients([])}>
                      Clear Selection
                    </Button>
                    {canUpdate && (
                      <Button variant="outline" size="sm">
                        Bulk Update
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Client Directory
              </CardTitle>
              <CardDescription>
                {filteredClients.length} of {clients.length} clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={() => toggleClientSelection(client.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.company}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span>{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSegmentIcon(client.segment)}
                            {getSegmentBadge(client.segment)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatCurrency(client.totalVolume)}</p>
                            <p className="text-xs text-muted-foreground">
                              Avg: {formatCurrency(client.avgTransactionSize)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.transactionCount}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {client.lastTransaction ? formatDate(client.lastTransaction) : 'No activity'}
                        </TableCell>
                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              {canUpdate && (
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Client
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteClient(client.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['VIP', 'Premium', 'Regular', 'Standard'].map((segment) => {
              const segmentClients = clients.filter(c => c.segment === segment)
              const segmentVolume = segmentClients.reduce((sum, c) => sum + c.totalVolume, 0)
              const percentage = (segmentClients.length / totalClients) * 100

              return (
                <Card key={segment}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getSegmentIcon(segment)}
                      {segment} Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{segmentClients.length}</p>
                      <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}% of total</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Volume</span>
                        <span className="font-medium">{formatCurrency(segmentVolume)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg per Client</span>
                        <span className="font-medium">
                          {segmentClients.length > 0 ? formatCurrency(segmentVolume / segmentClients.length) : '₺0'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Clients</CardTitle>
                <CardDescription>Highest transaction volume clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients
                    .sort((a, b) => b.totalVolume - a.totalVolume)
                    .slice(0, 5)
                    .map((client, index) => (
                      <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.company}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(client.totalVolume)}</p>
                          {getSegmentBadge(client.segment)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Activity</CardTitle>
                <CardDescription>Recent client engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">New Clients (30d)</p>
                      <p className="text-2xl font-bold text-green-600">12</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Churn Rate</p>
                      <p className="text-2xl font-bold text-red-600">2.1%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Client Retention</span>
                      <span className="font-medium">97.9%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '97.9%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}