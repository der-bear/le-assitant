import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';
import { 
  HelpCircle, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type Column = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'badge';
  sortable?: boolean;
  width?: string;
};

type Row = Record<string, any>;

type SortConfig = { 
  key: string; 
  dir: 'asc' | 'desc'; 
};

type Action = { 
  id: string; 
  label: string; 
  variant?: 'default' | 'secondary' | 'ghost'; 
  disabled?: boolean; 
};

type TableModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'table';
  columns: Column[];
  data: Row[];
  sort?: SortConfig;
  filterable?: boolean;
  filterPlaceholder?: string;
  pageable?: boolean;
  pageSize?: number;
  selection?: 'none' | 'single' | 'multiple';
  rowAction?: { id: string; label: string };
  exportable?: boolean; // simplified to just enable/disable export
  maxHeight?: string;
};

interface TableProps extends TableModule {
  onChange?: (changes: { 
    sort?: SortConfig | null; 
    filter?: string; 
    selection?: string | string[] | null;
    page?: number;
  }) => void;
  onAction?: (actionId: string, data?: any) => void;
}

export function Table({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  columns,
  data,
  sort,
  filterable = false,
  filterPlaceholder = 'Search...',
  pageable,
  pageSize = 25,
  selection = 'none',
  rowAction,
  exportable = true,
  maxHeight = '420px',
  onChange,
  onAction
}: TableProps) {
  const [currentSort, setCurrentSort] = useState<SortConfig | null>(sort || null);
  const [filter, setFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);

  // Auto-enable pagination if there are many rows
  const shouldPaginate = pageable !== undefined ? pageable : data.length > 50;
  const effectivePageSize = shouldPaginate ? pageSize : data.length;

  // Filter data
  const filteredData = useMemo(() => {
    if (!filter.trim()) return data;
    
    return data.filter(row => {
      return columns.some(col => {
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(filter.toLowerCase());
      });
    });
  }, [data, filter, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!currentSort) return filteredData;
    
    const { key, dir } = currentSort;
    return [...filteredData].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return dir === 'asc' ? -1 : 1;
      if (bValue == null) return dir === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return dir === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return dir === 'asc' ? -1 : 1;
      if (aStr > bStr) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, currentSort]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!shouldPaginate) return sortedData;
    
    const startIndex = currentPage * effectivePageSize;
    return sortedData.slice(startIndex, startIndex + effectivePageSize);
  }, [sortedData, currentPage, effectivePageSize, shouldPaginate]);

  const totalPages = shouldPaginate ? Math.ceil(sortedData.length / effectivePageSize) : 1;

  const handleSort = useCallback((key: string) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    let newSort: SortConfig | null = null;
    
    if (!currentSort || currentSort.key !== key) {
      newSort = { key, dir: 'asc' };
    } else if (currentSort.dir === 'asc') {
      newSort = { key, dir: 'desc' };
    } else {
      newSort = null; // Reset to unsorted
    }
    
    setCurrentSort(newSort);
    onChange?.({ sort: newSort });
  }, [columns, currentSort, onChange]);

  const handleFilterChange = useCallback((value: string) => {
    setFilter(value);
    setCurrentPage(0); // Reset to first page
    onChange?.({ filter: value, page: 0 });
  }, [onChange]);

  const handleRowSelection = useCallback((rowId: string, checked: boolean) => {
    if (selection === 'single') {
      // For single selection, clear all others and set only this one
      const newSelection = checked ? new Set([rowId]) : new Set<string>();
      setSelectedRows(newSelection);
      onChange?.({ selection: checked ? rowId : null });
    } else if (selection === 'multiple') {
      // For multiple selection, toggle the specific row
      const newSelection = new Set(selectedRows);
      if (checked) {
        newSelection.add(rowId);
      } else {
        newSelection.delete(rowId);
      }
      setSelectedRows(newSelection);
      onChange?.({ selection: Array.from(newSelection) });
    }
  }, [selectedRows, selection, onChange]);

  const handleSelectAll = useCallback((checked: boolean | "indeterminate") => {
    const currentlyAllSelected = paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row.id));
    
    if (checked === true || (checked !== false && !currentlyAllSelected)) {
      // Select all when checking or when indeterminate state is clicked
      const allIds = new Set(paginatedData.map(row => row.id));
      setSelectedRows(allIds);
      onChange?.({ selection: Array.from(allIds) });
    } else {
      // Deselect all
      setSelectedRows(new Set());
      onChange?.({ selection: [] });
    }
  }, [paginatedData, onChange, selectedRows]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    onChange?.({ page });
  }, [onChange]);

  const handleRowAction = useCallback((row: Row) => {
    if (rowAction) {
      onAction?.(rowAction.id, { row });
    }
  }, [rowAction, onAction]);

  const handleExport = useCallback(() => {
    onAction?.('export', { format: 'csv', scope: 'current' });
  }, [onAction]);

  const formatCellValue = useCallback((value: any, column: Column) => {
    if (value == null) return '';
    
    switch (column.type) {
      case 'number':
        return typeof value === 'number' 
          ? new Intl.NumberFormat('en-US').format(value)
          : value;
      case 'date':
        return typeof value === 'string' 
          ? new Date(value).toLocaleDateString()
          : value;
      case 'badge':
        return <Badge variant="secondary">{value}</Badge>;
      default:
        return String(value);
    }
  }, []);

  const getSortIcon = useCallback((columnKey: string) => {
    if (!currentSort || currentSort.key !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    }
    return currentSort.dir === 'asc' 
      ? <ArrowUp className="w-3 h-3" />
      : <ArrowDown className="w-3 h-3" />;
  }, [currentSort]);

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row.id));
  const isSomeSelected = paginatedData.some(row => selectedRows.has(row.id));
  
  // Indeterminate state: some but not all selected
  const isIndeterminate = isSomeSelected && !isAllSelected;

  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{title}</h3>
              {helpUrl && (
                <Button variant="ghost" size="sm" asChild className="h-4 w-4 p-0">
                  <a href={helpUrl} target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          {filterable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={filterPlaceholder}
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Single Export Button */}
          {exportable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 px-3 text-xs gap-2"
              title="Export table data as CSV"
            >
              <Download className="w-3 h-3" />
              Export
            </Button>
          )}

          {/* Custom Actions */}
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              disabled={loading || action.disabled}
              onClick={() => onAction?.(action.id)}
              className="h-8"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg overflow-hidden bg-card">
        <ScrollArea style={{ maxHeight }} className="w-full">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {filter ? `No results found for "${filter}"` : (empty || 'No data available')}
              </p>
            </div>
          ) : selection === 'single' ? (
            <RadioGroup
              value={Array.from(selectedRows)[0] || ''}
              onValueChange={(value) => handleRowSelection(value, true)}
            >
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr className="border-b">
                    {/* Selection Column */}
                    <th className="w-12 p-3 text-left"></th>

                    {/* Data Columns */}
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`p-3 font-medium ${
                          column.type === 'number' ? 'text-right' : 'text-left'
                        }`}
                        style={{ width: column.width }}
                      >
                        {column.sortable ? (
                          <span 
                            onClick={() => handleSort(column.key)}
                            className="font-medium cursor-pointer hover:text-foreground/80 transition-colors flex items-center gap-2"
                          >
                            {column.label}
                            {getSortIcon(column.key)}
                          </span>
                        ) : (
                          <span className="font-medium">{column.label}</span>
                        )}
                      </th>
                    ))}

                    {/* Action Column */}
                    {rowAction && (
                      <th className="w-20 p-3 text-right">
                        <span className="font-medium flex items-center justify-end">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr 
                      key={row.id || index} 
                      className={`border-b hover:bg-muted/30 transition-colors cursor-pointer ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                      }`}
                      onClick={() => {
                        handleRowSelection(row.id, !selectedRows.has(row.id));
                      }}
                    >
                      {/* Selection Column */}
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <RadioGroupItem value={row.id} />
                      </td>

                      {/* Data Columns */}
                      {columns.map((column) => (
                        <td 
                          key={column.key} 
                          className={`p-3 ${
                            column.type === 'number' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatCellValue(row[column.key], column)}
                        </td>
                      ))}

                      {/* Action Column */}
                      {rowAction && (
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRowAction(row)}
                            className="h-6 px-2 text-xs"
                          >
                            {rowAction.label}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </RadioGroup>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="border-b">
                  {/* Selection Column */}
                  {selection !== 'none' && (
                    <th className="w-12 p-3 text-left">
                      {selection === 'multiple' && (
                        <Checkbox
                          checked={isIndeterminate ? "indeterminate" : isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      )}
                    </th>
                  )}

                  {/* Data Columns */}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`p-3 font-medium ${
                        column.type === 'number' ? 'text-right' : 'text-left'
                      }`}
                      style={{ width: column.width }}
                    >
                      {column.sortable ? (
                        <span 
                          onClick={() => handleSort(column.key)}
                          className="font-medium cursor-pointer hover:text-foreground/80 transition-colors flex items-center gap-2"
                        >
                          {column.label}
                          {getSortIcon(column.key)}
                        </span>
                      ) : (
                        <span className="font-medium">{column.label}</span>
                      )}
                    </th>
                  ))}

                  {/* Action Column */}
                  {rowAction && (
                    <th className="w-20 p-3 text-right">
                      <span className="font-medium flex items-center justify-end">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr 
                    key={row.id || index} 
                    className={`border-b hover:bg-muted/30 transition-colors cursor-pointer ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    }`}
                    onClick={() => {
                      if (selection !== 'none') {
                        handleRowSelection(row.id, !selectedRows.has(row.id));
                      }
                    }}
                  >
                    {/* Selection Column */}
                    {selection !== 'none' && (
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows.has(row.id)}
                          onCheckedChange={(checked) => handleRowSelection(row.id, !!checked)}
                        />
                      </td>
                    )}

                    {/* Data Columns */}
                    {columns.map((column) => (
                      <td 
                        key={column.key} 
                        className={`p-3 ${
                          column.type === 'number' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatCellValue(row[column.key], column)}
                      </td>
                    ))}

                    {/* Action Column */}
                    {rowAction && (
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRowAction(row)}
                          className="h-6 px-2 text-xs"
                        >
                          {rowAction.label}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </div>

      {/* Pagination */}
      {shouldPaginate && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages} ({sortedData.length} items)
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="h-8 w-8 p-0"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8 p-0"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}