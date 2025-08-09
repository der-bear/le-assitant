import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { 
  HelpCircle, 
  Search, 
  ExternalLink, 
  FileText, 
  Code, 
  Play, 
  MessageSquare, 
  Calendar,
  Star,
  Filter,
  Copy
} from 'lucide-react';

type HelpKind = 'article' | 'api' | 'howto' | 'release' | 'video' | 'faq';
type HelpSource = 'KnowledgeBase' | 'API Docs' | 'Patch Notes' | 'Support' | 'External';

type HelpResult = {
  id: string;
  title: string;
  description?: string;
  snippet?: string;
  url: string;
  kind: HelpKind;
  source: HelpSource;
  icon?: string;
  updatedAt?: string;
  confidence?: number;
  badges?: string[];
  ctaLabel?: string;
};

type HelpFacets = {
  kinds?: HelpKind[];
  sources?: HelpSource[];
  updated?: '7d' | '30d' | '90d' | 'any';
};

type HelpSection = {
  id: string;
  title: string;
  results: HelpResult[];
};

type Action = { 
  id: string; 
  label: string; 
  variant?: 'default' | 'secondary' | 'ghost'; 
  disabled?: boolean; 
};

type HelpSourcesModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'help-sources';
  query?: string;
  remote?: boolean;
  layout?: 'list' | 'cards';
  results?: HelpResult[];
  sections?: HelpSection[];
  facets?: HelpFacets;
  availableFacets?: HelpFacets;
  pageSize?: number;
  nextCursor?: string | null;
  showInlineAnswer?: boolean;
  relatedQuestions?: string[];
  context?: {
    activeToolId?: string;
    screen?: string;
    leadTypeUID?: number;
    clientUID?: number;
  };
};

interface HelpSourcesProps extends HelpSourcesModule {
  onChange?: (query: string) => void;
  onAction?: (actionId: string, data?: any) => void;
  onRequestSearch?: (query: string, facets?: HelpFacets) => void;
  onRequestLoadMore?: (cursor: string) => void;
  onResultClick?: (result: HelpResult) => void;
  onRelatedQuestionClick?: (question: string) => void;
}

const KIND_ICONS: Record<HelpKind, React.ReactNode> = {
  article: <FileText className="w-4 h-4" />,
  api: <Code className="w-4 h-4" />,
  howto: <HelpCircle className="w-4 h-4" />,
  release: <Calendar className="w-4 h-4" />,
  video: <Play className="w-4 h-4" />,
  faq: <MessageSquare className="w-4 h-4" />
};

export function HelpSources({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  query: initialQuery = '',
  remote = true,
  layout = 'list',
  results = [],
  sections = [],
  facets = {},
  availableFacets = {},
  pageSize = 10,
  nextCursor = null,
  showInlineAnswer = false,
  relatedQuestions = [],
  context,
  onChange,
  onAction,
  onRequestSearch,
  onRequestLoadMore,
  onResultClick,
  onRelatedQuestionClick
}: HelpSourcesProps) {
  const [query, setQuery] = useState(initialQuery);
  const [appliedFacets, setAppliedFacets] = useState<HelpFacets>(facets);
  const [showFacets, setShowFacets] = useState(false);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onChange?.(query);
    if (remote && onRequestSearch) {
      onRequestSearch(query, appliedFacets);
    }
  }, [query, appliedFacets, remote, onChange, onRequestSearch]);

  const handleResultClick = useCallback((result: HelpResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    }
  }, [onResultClick]);

  const handleLoadMore = useCallback(() => {
    if (nextCursor && onRequestLoadMore) {
      onRequestLoadMore(nextCursor);
    }
  }, [nextCursor, onRequestLoadMore]);

  const handleFacetChange = useCallback((facetType: keyof HelpFacets, value: any) => {
    const newFacets = { ...appliedFacets };
    
    if (facetType === 'kinds' || facetType === 'sources') {
      const currentValues = (newFacets[facetType] as string[]) || [];
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      newFacets[facetType] = updatedValues.length > 0 ? updatedValues as any : undefined;
    } else {
      newFacets[facetType] = value as any;
    }
    
    setAppliedFacets(newFacets);
    
    if (remote && onRequestSearch) {
      onRequestSearch(query, newFacets);
    }
  }, [appliedFacets, query, remote, onRequestSearch]);

  const formatUpdatedAt = useCallback((updatedAt: string) => {
    const date = new Date(updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }, []);

  const renderResult = useCallback((result: HelpResult, index: number) => {
    const confidenceColor = result.confidence && result.confidence > 0.8 ? 'text-green-600' : 
                           result.confidence && result.confidence > 0.6 ? 'text-yellow-600' : 
                           'text-muted-foreground';

    if (layout === 'cards') {
      return (
        <Card key={result.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
          <button
            onClick={() => handleResultClick(result)}
            className="w-full text-left space-y-3"
          >
            <div className="flex items-center gap-2">
              {KIND_ICONS[result.kind]}
              <h4 className="font-medium line-clamp-2">{result.title}</h4>
            </div>
            
            {result.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {result.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {result.badges?.map((badge) => (
                  <Badge key={badge} variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {result.confidence && (
                  <div className={`flex items-center gap-1 ${confidenceColor}`}>
                    <Star className="w-3 h-3" />
                    {Math.round(result.confidence * 100)}%
                  </div>
                )}
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{result.source}</span>
              {result.updatedAt && <span>{formatUpdatedAt(result.updatedAt)}</span>}
            </div>
          </button>
        </Card>
      );
    }

    // List layout
    return (
      <button
        key={result.id}
        onClick={() => handleResultClick(result)}
        className="w-full p-4 text-left hover:bg-accent rounded-lg transition-colors"
      >
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-muted-foreground">
              {KIND_ICONS[result.kind]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{result.title}</h4>
                {result.badges?.map((badge) => (
                  <Badge key={badge} variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                ))}
                {result.confidence && (
                  <div className={`flex items-center gap-1 text-xs ${confidenceColor}`}>
                    <Star className="w-3 h-3" />
                    {Math.round(result.confidence * 100)}%
                  </div>
                )}
              </div>
              
              {result.snippet && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {result.snippet}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{result.source}</span>
                <div className="flex items-center gap-2">
                  {result.updatedAt && <span>{formatUpdatedAt(result.updatedAt)}</span>}
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }, [layout, handleResultClick, formatUpdatedAt]);

  const allResults = sections.length > 0 
    ? sections.flatMap(section => section.results)
    : results;

  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
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

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles, guides, and documentation..."
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={loading}>
            Search
          </Button>
          {Object.keys(availableFacets).length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFacets(!showFacets)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          )}
        </div>

        {/* Facets */}
        {showFacets && Object.keys(availableFacets).length > 0 && (
          <Card className="p-4 space-y-4">
            {availableFacets.kinds && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type</label>
                <div className="flex flex-wrap gap-2">
                  {availableFacets.kinds.map((kind) => (
                    <Button
                      key={kind}
                      type="button"
                      variant={appliedFacets.kinds?.includes(kind) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFacetChange('kinds', kind)}
                      className="capitalize text-xs"
                    >
                      {kind}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {availableFacets.sources && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>
                <div className="flex flex-wrap gap-2">
                  {availableFacets.sources.map((source) => (
                    <Button
                      key={source}
                      type="button"
                      variant={appliedFacets.sources?.includes(source) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFacetChange('sources', source)}
                      className="text-xs"
                    >
                      {source}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </form>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Inline Answer */}
      {showInlineAnswer && query && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Quick Answer</h4>
            <p className="text-sm text-muted-foreground">
              Based on your search for "{query}", here are the key points from our documentation...
            </p>
          </div>
        </Card>
      )}

      {/* Related Questions */}
      {relatedQuestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Related Questions</h4>
          <div className="flex flex-wrap gap-2">
            {relatedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onRelatedQuestionClick?.(question)}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="border rounded-lg p-6 shadow-lg bg-card">
        <div className="space-y-4">
        {loading && allResults.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: pageSize }).map((_, index) => (
              <Skeleton key={index} className={layout === 'cards' ? 'h-32' : 'h-24'} />
            ))}
          </div>
        ) : allResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {query ? `No results found for "${query}"` : (empty || 'No help articles available')}
            </p>
          </div>
        ) : (
          <>
            {sections.length > 0 ? (
              // Sectioned results
              sections.map((section) => (
                <div key={section.id} className="space-y-4">
                  <h4 className="font-medium">{section.title}</h4>
                  <div className={layout === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-1'}>
                    {section.results.map((result, index) => renderResult(result, index))}
                  </div>
                </div>
              ))
            ) : (
              // Flat results
              <div className={layout === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-1'}>
                {results.map((result, index) => renderResult(result, index))}
              </div>
            )}

            {/* Load More */}
            {nextCursor && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
        </div>
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
  );
}