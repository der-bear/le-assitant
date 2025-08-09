import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Download, ChevronUp, ChevronDown } from 'lucide-react';

interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'badge' | 'action';
  sortable?: boolean;
}

interface TableRow {
  id: string;
  [key: string]: any;
}

interface SimpleTableProps {
  title?: string;
  description?: string;
  columns: TableColumn[];
  data: TableRow[];
  searchable?: boolean;
  sortable?: boolean;
  downloadable?: boolean;
  maxHeight?: string;
  onRowAction?: (action: string, row: TableRow) => void;
}

export function SimpleTable({ 
  title, 
  description,
  columns, 
  data, 
  searchable = true,
  sortable = true,
  downloadable = false,
  maxHeight = "300px",
  onRowAction
}: SimpleTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  // Filter data based on search
  const filteredData = searchable ? data.filter(row =>
    Object.values(row).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) : data;

  // Sort data
  const sortedData = sortable && sortConfig ? [...filteredData].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  }) : filteredData;

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const formatValue = (value: any, type?: string) => {
    if (!value) return '-';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'badge':
        return (
          <Badge variant="secondary" className="text-xs font-normal">
            {value}
          </Badge>
        );
      case 'action':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs font-normal h-6"
            onClick={() => onRowAction?.(value, data.find(d => d.id === value) || {} as TableRow)}
          >
            {value}
          </Button>
        );
      default:
        return value;
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortable || !sortConfig || sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-3 h-3" /> : 
      <ChevronDown className="w-3 h-3" />;
  };

  return (
    <Card className="p-4 max-w-4xl">
      <div className="space-y-4">
        {(title || description || searchable || downloadable) && (
          <div className="space-y-3">
            {(title || description) && (
              <div>
                {title && <h4 className="text-sm font-medium">{title}</h4>}
                {description && (
                  <p className="text-xs font-normal text-muted-foreground">{description}</p>
                )}
              </div>
            )}
            
            {(searchable || downloadable) && (
              <div className="flex items-center gap-2">
                {searchable && (
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-7 text-xs font-normal h-8"
                    />
                  </div>
                )}
                {downloadable && (
                  <Button variant="outline" size="sm" className="text-xs font-normal h-8">
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-auto" style={{ maxHeight }}>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {columns.map(column => (
                    <th 
                      key={column.key}
                      className={`px-3 py-2 text-left text-xs font-medium text-muted-foreground ${
                        column.sortable && sortable ? 'cursor-pointer hover:bg-muted/70' : ''
                      }`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map(row => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    {columns.map(column => (
                      <td key={column.key} className="px-3 py-2 text-sm font-normal">
                        {formatValue(row[column.key], column.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sortedData.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm font-normal">No data found</p>
              </div>
            )}
          </div>
        </div>

        {searchable && (
          <div className="text-xs font-normal text-muted-foreground">
            Showing {sortedData.length} of {data.length} rows
          </div>
        )}
      </div>
    </Card>
  );
}