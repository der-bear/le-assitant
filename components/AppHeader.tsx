import React from 'react';
import { Badge } from './ui/badge';
import { Bot, MessageSquare, Wrench } from 'lucide-react';

export function AppHeader() {
  return (
    <div className="border-b bg-background px-4 py-3" style={{ fontSize: '14px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="text-base font-medium">LeadExec AI Assistant</h1>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">Beta</Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Conversational AI</span>
          </div>
          <div className="w-px h-4 bg-border"></div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            <span>Quick Tools</span>
          </div>
        </div>
      </div>
    </div>
  );
}