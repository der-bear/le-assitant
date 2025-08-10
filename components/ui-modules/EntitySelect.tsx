import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { HelpCircle, Search, X, Plus, Check, ChevronDown } from 'lucide-react';

type EntityOption = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
};

type Action = { 
  id: string; 
  label: string; 
  variant?: 'default' | 'secondary' | 'ghost'; 
  disabled?: boolean; 
};

type EntitySelectModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'entity-select';
  mode?: 'single' | 'multiple';
  value?: string | string[];
  placeholder?: string;
  allowClear?: boolean;
  options?: EntityOption[];
  remote?: boolean;
  pageSize?: number;
  nextCursor?: string | null;
  debounceMs?: number;
  creatable?: boolean | { label: string };
};

interface EntitySelectProps extends EntitySelectModule {
  onChange?: (value: string | string[]) => void;
  onAction?: (actionId: string, data?: any) => void;
  onRequestSearch?: (query: string, pageSize: number) => void;
  onRequestLoadMore?: (query: string, cursor: string, pageSize: number) => void;
  onRequestCreate?: (query: string) => void;
}

export function EntitySelect({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  mode = 'single',
  value,
  placeholder = 'Search…',
  allowClear = true,
  options = [],
  remote = false,
  pageSize = 25,
  nextCursor = null,
  debounceMs = 250,
  creatable = false,
  onChange,
  onAction,
  onRequestSearch,
  onRequestLoadMore,
  onRequestCreate
}: EntitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<EntityOption[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize selected options from value
  useEffect(() => {
    if (!value) {
      setSelectedOptions([]);
      return;
    }

    const values = Array.isArray(value) ? value : [value];
    const selected = options.filter(opt => values.includes(opt.id));
    setSelectedOptions(selected);
  }, [value, options]);

  // Debounce search query
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (remote && debouncedQuery !== '' && onRequestSearch) {
      setHasSearched(true);
      onRequestSearch(debouncedQuery, pageSize);
    }
  }, [debouncedQuery, remote, pageSize, onRequestSearch]);

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggleOpen = useCallback(() => {
    setIsOpen(!isOpen);
    if (!isOpen && remote && !hasSearched && onRequestSearch) {
      // Initial load for remote
      onRequestSearch('', pageSize);
      setHasSearched(true);
    }
  }, [isOpen, remote, hasSearched, pageSize, onRequestSearch]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
  }, []);

  const handleOptionSelect = useCallback((option: EntityOption) => {
    let newValue: string | string[];
    
    if (mode === 'single') {
      setSelectedOptions([option]);
      newValue = option.id;
      setIsOpen(false);
    } else {
      const isSelected = selectedOptions.some(opt => opt.id === option.id);
      const newSelected = isSelected
        ? selectedOptions.filter(opt => opt.id !== option.id)
        : [...selectedOptions, option];
      
      setSelectedOptions(newSelected);
      newValue = newSelected.map(opt => opt.id);
    }

    onChange?.(newValue);
  }, [mode, selectedOptions, onChange]);

  const handleClear = useCallback(() => {
    setSelectedOptions([]);
    onChange?.(mode === 'single' ? '' : []);
  }, [mode, onChange]);

  const handleRemoveOption = useCallback((optionToRemove: EntityOption, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = selectedOptions.filter(opt => opt.id !== optionToRemove.id);
    setSelectedOptions(newSelected);
    onChange?.(newSelected.map(opt => opt.id));
  }, [selectedOptions, onChange]);

  const handleLoadMore = useCallback(() => {
    if (nextCursor && onRequestLoadMore && !loadingMore) {
      setLoadingMore(true);
      onRequestLoadMore(debouncedQuery, nextCursor, pageSize);
    }
  }, [nextCursor, debouncedQuery, pageSize, loadingMore, onRequestLoadMore]);

  const handleCreateOption = useCallback(() => {
    if (query.trim() && onRequestCreate) {
      onRequestCreate(query.trim());
      setQuery('');
    }
  }, [query, onRequestCreate]);

  const filteredOptions = remote ? options : options.filter(option =>
    option.label.toLowerCase().includes(query.toLowerCase()) ||
    (option.description && option.description.toLowerCase().includes(query.toLowerCase()))
  );

  const hasSelection = selectedOptions.length > 0;
  const showCreateOption = creatable && query.trim() && 
    !filteredOptions.some(opt => opt.label.toLowerCase() === query.toLowerCase());

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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Input */}
      <div className="space-y-4">
        <div ref={containerRef} className="relative">
          <div
            className="flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
            onClick={handleToggleOpen}
          >
            {/* Selected Values */}
            <div className="flex-1 flex flex-wrap items-center gap-1 min-h-6">
              {mode === 'multiple' && selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <Badge key={option.id} variant="secondary" className="gap-1">
                    {option.label}
                    <button
                      onClick={(e) => handleRemoveOption(option, e)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              ) : mode === 'single' && selectedOptions.length > 0 ? (
                <span className="text-foreground">{selectedOptions[0].label}</span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>

            {/* Clear Button */}
            {hasSelection && allowClear && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="flex items-center justify-center w-4 h-4 hover:bg-muted rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Chevron */}
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg">
              {/* Search Input */}
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={handleSearchChange}
                    placeholder="Search…"
                    className="pl-7 h-8"
                    autoFocus
                  />
                </div>
              </div>

              {/* Options List */}
              <ScrollArea className="max-h-64">
                <div className="p-1">
                  {loading && !options.length ? (
                    <div className="space-y-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : filteredOptions.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      {hasSearched && query ? `No results for "${query}"` : (empty || 'No options available')}
                    </div>
                  ) : (
                    <>
                      {/* Create Option */}
                      {showCreateOption && (
                        <button
                          onClick={handleCreateOption}
                          className="w-full flex items-center gap-2 p-2 text-sm hover:bg-accent rounded-sm"
                        >
                          <Plus className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {typeof creatable === 'object' ? creatable.label : 'Create'} "{query}"
                          </span>
                        </button>
                      )}

                      {/* Options */}
                      {filteredOptions.map((option) => {
                        const isSelected = selectedOptions.some(opt => opt.id === option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleOptionSelect(option)}
                            className="w-full flex items-center justify-between p-2 text-sm hover:bg-accent rounded-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex-1 text-left min-w-0">
                                <div className="font-medium truncate">{option.label}</div>
                                {option.description && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {option.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        );
                      })}

                      {/* Load More */}
                      {nextCursor && (
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="w-full p-2 text-sm text-muted-foreground hover:bg-accent rounded-sm disabled:opacity-50"
                        >
                          {loadingMore ? 'Loading...' : 'Load more...'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-3">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                disabled={loading || action.disabled}
                onClick={() => onAction?.(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}