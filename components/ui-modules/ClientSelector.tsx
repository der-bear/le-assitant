import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, Filter, Users, Building, Mail, CheckCircle, X, ChevronDown } from 'lucide-react';

interface Client {
  id: string;
  companyName: string;
  email: string;
  status: 'Active' | 'Inactive' | 'Pending';
  leads: number;
  lastActivity: Date;
  tags: string[];
  deliveryMethod: string;
}

interface ClientSelectorProps {
  title?: string;
  description?: string;
  clients: Client[];
  mode?: 'single' | 'multiple';
  preSelected?: string[];
  onSelectionChange: (selectedClients: Client[]) => void;
  onConfirm?: (selectedClients: Client[]) => void;
  showPreview?: boolean;
  maxHeight?: string;
}

export function ClientSelector({
  title = "Select Clients",
  description,
  clients,
  mode = 'multiple',
  preSelected = [],
  onSelectionChange,
  onConfirm,
  showPreview = true,
  maxHeight = "350px"
}: ClientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelected));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [currentTab, setCurrentTab] = useState('search');

  // Advanced filters
  const [minLeads, setMinLeads] = useState('');
  const [maxLeads, setMaxLeads] = useState('');
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');

  const filteredClients = clients.filter(client => {
    // Basic search
    const matchesSearch = !searchQuery || 
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

    // Leads filter
    const matchesLeads = (!minLeads || client.leads >= parseInt(minLeads)) &&
                        (!maxLeads || client.leads <= parseInt(maxLeads));

    // Delivery method filter
    const matchesDelivery = deliveryMethodFilter === 'all' || 
                           client.deliveryMethod === deliveryMethodFilter;

    // Tag filter
    const matchesTag = !tagFilter || 
                      client.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesLeads && matchesDelivery && matchesTag;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.companyName.localeCompare(b.companyName);
      case 'leads':
        return b.leads - a.leads;
      case 'activity':
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const selectedClients = clients.filter(client => selectedIds.has(client.id));

  useEffect(() => {
    onSelectionChange(selectedClients);
  }, [selectedIds]);

  const handleClientToggle = (clientId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      if (mode === 'single') {
        newSelected.clear();
      }
      newSelected.add(clientId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClients.map(c => c.id)));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setMinLeads('');
    setMaxLeads('');
    setDeliveryMethodFilter('all');
    setTagFilter('');
  };

  const getQuickFilters = () => {
    const activeClients = clients.filter(c => c.status === 'Active').length;
    const highVolumeClients = clients.filter(c => c.leads > 100).length;
    const recentClients = clients.filter(c => 
      new Date(c.lastActivity).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    return [
      { label: `Active (${activeClients})`, filter: () => setStatusFilter('Active') },
      { label: `High Volume (${highVolumeClients})`, filter: () => setMinLeads('100') },
      { label: `Recent Activity (${recentClients})`, filter: () => {
        setCurrentTab('advanced');
        // Apply recent filter logic
      }}
    ];
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variant = status === 'Active' ? 'default' : 
                   status === 'Pending' ? 'secondary' : 'outline';
    return <Badge variant={variant} className="text-xs font-normal">{status}</Badge>;
  };

  return (
    <Card className="p-4 max-w-4xl">
      <div className="space-y-4 max-h-[500px] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{title}</h4>
            {selectedIds.size > 0 && (
              <Badge variant="secondary" className="text-xs font-normal">
                {selectedIds.size} selected
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs font-normal text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Selection Summary - Fixed */}
        {selectedIds.size > 0 && showPreview && (
          <div className="p-3 bg-accent/30 rounded-md flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Selected Clients</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="h-6 text-xs font-normal"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from(selectedIds).slice(0, 5).map(id => {
                const client = clients.find(c => c.id === id);
                return client ? (
                  <Badge key={id} variant="secondary" className="text-xs font-normal">
                    {client.companyName}
                    <button
                      onClick={() => handleClientToggle(id)}
                      className="ml-1 hover:bg-background/20 rounded-full w-3 h-3 flex items-center justify-center"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </Badge>
                ) : null;
              })}
              {selectedIds.size > 5 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{selectedIds.size - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Filter Tabs - Fixed */}
        <div className="flex-shrink-0">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search" className="text-xs font-normal">Search</TabsTrigger>
              <TabsTrigger value="quick" className="text-xs font-normal">Quick Filters</TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs font-normal">Advanced</TabsTrigger>
            </TabsList>

          <TabsContent value="search" className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm font-normal"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="quick" className="space-y-3">
            <div className="grid gap-2">
              {getQuickFilters().map((filter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={filter.filter}
                  className="justify-start text-xs font-normal h-8"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Delivery Method</label>
                <Select value={deliveryMethodFilter} onValueChange={setDeliveryMethodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="ftp">FTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Min Leads</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minLeads}
                  onChange={(e) => setMinLeads(e.target.value)}
                  className="text-sm font-normal"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Max Leads</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={maxLeads}
                  onChange={(e) => setMaxLeads(e.target.value)}
                  className="text-sm font-normal"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Tags</label>
              <Input
                placeholder="Tags..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="text-sm font-normal"
              />
            </div>
            <Button variant="outline" onClick={clearFilters} className="text-xs font-normal">
              Clear Filters
            </Button>
          </TabsContent>
          </Tabs>
        </div>

        {/* Scrollable Results Area */}
        <div className="flex-1 min-h-0 space-y-3">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-muted-foreground">
              Showing {sortedClients.length} of {clients.length} clients
            </span>
            {mode === 'multiple' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs font-normal h-6"
              >
                {selectedIds.size === filteredClients.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>

          {/* Client List */}
          <div className="border rounded-md overflow-hidden flex-1">
            <div className="overflow-auto" style={{ maxHeight }}>
              <div className="space-y-0">
                {sortedClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent/30 transition-colors ${
                    selectedIds.has(client.id) ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => handleClientToggle(client.id)}
                >
                  <div className="flex items-start gap-3">
                    {mode === 'multiple' && (
                      <Checkbox
                        checked={selectedIds.has(client.id)}
                        className="mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-medium truncate">{client.companyName}</h5>
                        <StatusBadge status={client.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs font-normal text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {client.leads} leads
                        </span>
                        <span>
                          {new Date(client.lastActivity).toLocaleDateString()}
                        </span>
                      </div>
                      {client.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {client.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs font-normal">
                              {tag}
                            </Badge>
                          ))}
                          {client.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs font-normal">
                              +{client.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed */}
        {onConfirm && selectedIds.size > 0 && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={() => onConfirm(selectedClients)}
              className="text-sm font-normal"
            >
              Confirm Selection ({selectedIds.size})
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-normal"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}