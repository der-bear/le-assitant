import React, { useCallback } from 'react';
import { Card } from '../ui/card';
import { ExternalLink } from 'lucide-react';

type HelpKind = 'article' | 'api' | 'howto' | 'release' | 'video' | 'faq';
type HelpSource = 'KnowledgeBase' | 'API Docs' | 'Patch Notes' | 'Support' | 'External';

type HelpResult = {
  id: string;
  title: string;
  description?: string;
  url: string;
  kind: HelpKind;
  source: HelpSource;
  badges?: string[];
};

type HelpSourcesModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  kind: 'help-sources';
  results: HelpResult[];
};

interface HelpSourcesProps extends HelpSourcesModule {
  onResultClick?: (result: HelpResult) => void;
}

export function HelpSources({
  id,
  title,
  description,
  loading = false,
  error,
  empty,
  results,
  onResultClick
}: HelpSourcesProps) {
  const handleResultClick = useCallback((result: HelpResult) => {
    window.open(result.url, '_blank', 'noopener,noreferrer');
    onResultClick?.(result);
  }, [onResultClick]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-destructive">
        <p className="text-destructive text-sm">{error}</p>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-sm">{empty || 'No help sources found'}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {results.map((result) => (
        <div 
          key={result.id} 
          className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
          onClick={() => handleResultClick(result)}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors flex-1">
                {result.title}
              </h3>
              <span className="text-xs text-muted-foreground capitalize">
                {result.kind}
              </span>
            </div>
            
            <div className="flex items-end justify-between gap-2">
              <div className="flex-1">
                {result.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.description}
                  </p>
                )}
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}