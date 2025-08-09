import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Search, Download, Filter, MoreHorizontal } from 'lucide-react';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'badge' | 'action';
  width?: string;
}

interface TableRow {
  id: string;
  [key: string]: any;
}

interface DataTableProps {
  title: string;
  columns: TableColumn[];
  data: TableRow[];
  searchable?: boolean;
  downloadable?: boolean;
  filterable?: boolean;
  onRowAction?: (action: string, row: TableRow) => void;
  maxHeight?: string;
}

export function DataTable({ 
  title, 
  columns, 
  data, 
  searchable = true,
  downloadable = true,
  filterable = false,
  onRowAction,
  maxHeight = "400px"
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredData = data.filter(row => {
    if (!searchQuery) return true;
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const renderCell = (column: TableColumn, value: any, row: TableRow) => {
    switch (column.type) {
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
            onClick={() => onRowAction?.(value, row)}
            className="h-6 w-6 p-0"
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        );
      case 'number':
        return <span className="text-sm font-normal tabular-nums">{value}</span>;
      case 'date':
        return <span className="text-sm font-normal">{new Date(value).toLocaleDateString()}</span>;
      default:
        return <span className="text-sm font-normal">{value}</span>;
    }
  };

  return (
    <Card className="p-4 max-w-4xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{title}</h4>
          <div className="flex items-center gap-2">
            {filterable && (
              <Button variant="outline" size="sm" className="text-xs font-normal">
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </Button>
            )}
            {downloadable && (
              <Button variant="outline" size="sm" className="text-xs font-normal">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>

        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm font-normal"
            />
          </div>
        )}

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-auto" style={{ maxHeight }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  {columns.map(column => (
                    <TableHead
                      key={column.key}
                      className={`text-xs font-medium ${column.width ? `w-${column.width}` : ''} ${
                        column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                      }`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.sortable && sortColumn === column.key && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map(row => (
                  <TableRow key={row.id}>
                    {columns.map(column => (
                      <TableCell key={column.key} className="py-2">
                        {renderCell(column, row[column.key], row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-normal text-muted-foreground">
          <span>Showing {sortedData.length} of {data.length} records</span>
          {searchQuery && (
            <span>Filtered by: "{searchQuery}"</span>
          )}
        </div>
      </div>
    </Card>
  );
}