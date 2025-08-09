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

interface ParsedMention {
  type: 'specific' | 'filtered' | 'all' | 'none';
  clientIds?: string[];
  filters?: {
    status?: string[];
    minLeads?: number;
    maxLeads?: number;
    tags?: string[];
    deliveryMethod?: string[];
    timeframe?: string;
    companies?: string[];
  };
  confidence: number;
  originalText: string;
}

export class ClientMentionParser {
  private clients: Client[];

  constructor(clients: Client[]) {
    this.clients = clients;
  }

  parseClientMention(text: string): ParsedMention {
    const lowerText = text.toLowerCase();
    
    // Check for "all clients" mentions
    if (this.matchesAllClients(lowerText)) {
      return {
        type: 'all',
        confidence: 0.9,
        originalText: text
      };
    }

    // Check for specific company mentions
    const specificMentions = this.findSpecificCompanyMentions(text, lowerText);
    if (specificMentions.clientIds && specificMentions.clientIds.length > 0) {
      return {
        type: 'specific',
        clientIds: specificMentions.clientIds,
        confidence: specificMentions.confidence,
        originalText: text
      };
    }

    // Check for filtered mentions
    const filteredMentions = this.parseFilteredMentions(lowerText);
    if (filteredMentions.filters && Object.keys(filteredMentions.filters).length > 0) {
      return {
        type: 'filtered',
        filters: filteredMentions.filters,
        confidence: filteredMentions.confidence,
        originalText: text
      };
    }

    return {
      type: 'none',
      confidence: 0,
      originalText: text
    };
  }

  private matchesAllClients(text: string): boolean {
    const allPhrases = [
      'all clients',
      'all my clients',
      'every client',
      'all companies',
      'entire client base',
      'all customer',
      'complete list'
    ];
    
    return allPhrases.some(phrase => text.includes(phrase));
  }

  private findSpecificCompanyMentions(originalText: string, lowerText: string): { clientIds?: string[], confidence: number } {
    const mentionedClients: string[] = [];
    let totalConfidence = 0;
    let mentionCount = 0;

    // Look for exact company name matches
    for (const client of this.clients) {
      const companyLower = client.companyName.toLowerCase();
      
      // Exact match
      if (lowerText.includes(companyLower)) {
        mentionedClients.push(client.id);
        totalConfidence += 0.95;
        mentionCount++;
        continue;
      }

      // Partial match with high similarity
      if (this.calculateSimilarity(lowerText, companyLower) > 0.7) {
        mentionedClients.push(client.id);
        totalConfidence += 0.7;
        mentionCount++;
        continue;
      }

      // Email domain match
      const emailDomain = client.email.split('@')[1];
      if (lowerText.includes(emailDomain.toLowerCase())) {
        mentionedClients.push(client.id);
        totalConfidence += 0.6;
        mentionCount++;
      }
    }

    // Look for patterns like "acme, techstart, and global"
    const companyListPattern = this.parseCompanyList(originalText);
    if (companyListPattern.length > 0) {
      for (const companyName of companyListPattern) {
        const matchedClient = this.clients.find(c => 
          this.calculateSimilarity(c.companyName.toLowerCase(), companyName.toLowerCase()) > 0.6
        );
        if (matchedClient && !mentionedClients.includes(matchedClient.id)) {
          mentionedClients.push(matchedClient.id);
          totalConfidence += 0.8;
          mentionCount++;
        }
      }
    }

    return {
      clientIds: mentionedClients,
      confidence: mentionCount > 0 ? totalConfidence / mentionCount : 0
    };
  }

  private parseCompanyList(text: string): string[] {
    // Look for patterns like "acme, techstart, and global solutions"
    const listPattern = /(?:(?:for|with|including|show me)\s+)?([a-zA-Z\s,&]+?)(?:\s+(?:clients?|companies|and))/gi;
    const matches = text.match(listPattern);
    
    if (!matches) return [];

    const companies: string[] = [];
    for (const match of matches) {
      const cleaned = match.replace(/(?:for|with|including|show me|clients?|companies|and)/gi, '').trim();
      const parts = cleaned.split(/,|\s+and\s+/).map(p => p.trim()).filter(p => p.length > 2);
      companies.push(...parts);
    }

    return companies;
  }

  private parseFilteredMentions(text: string): { filters?: any, confidence: number } {
    const filters: any = {};
    let confidence = 0;
    let filterCount = 0;

    // Status filters
    if (text.includes('active client')) {
      filters.status = ['Active'];
      confidence += 0.9;
      filterCount++;
    }
    if (text.includes('inactive client') || text.includes('disabled client')) {
      filters.status = ['Inactive'];
      confidence += 0.9;
      filterCount++;
    }
    if (text.includes('pending client')) {
      filters.status = ['Pending'];
      confidence += 0.9;
      filterCount++;
    }

    // Lead volume filters
    const highVolumePattern = /(?:high volume|high lead|many lead|over (\d+)|more than (\d+))/i;
    const highVolumeMatch = text.match(highVolumePattern);
    if (highVolumeMatch) {
      const threshold = highVolumeMatch[1] || highVolumeMatch[2] || '100';
      filters.minLeads = parseInt(threshold);
      confidence += 0.8;
      filterCount++;
    }

    const lowVolumePattern = /(?:low volume|few lead|under (\d+)|less than (\d+))/i;
    const lowVolumeMatch = text.match(lowVolumePattern);
    if (lowVolumeMatch) {
      const threshold = lowVolumeMatch[1] || lowVolumeMatch[2] || '50';
      filters.maxLeads = parseInt(threshold);
      confidence += 0.8;
      filterCount++;
    }

    // Delivery method filters
    if (text.includes('email client') || text.includes('email deliver')) {
      filters.deliveryMethod = ['email'];
      confidence += 0.85;
      filterCount++;
    }
    if (text.includes('webhook client') || text.includes('api client')) {
      filters.deliveryMethod = ['webhook'];
      confidence += 0.85;
      filterCount++;
    }

    // Time-based filters
    if (text.includes('recent') || text.includes('active in') || text.includes('this week')) {
      filters.timeframe = 'recent';
      confidence += 0.7;
      filterCount++;
    }

    // Tag-based filters
    const tagPattern = /(?:tagged|tag|with tag|labeled)\s+(?:as\s+)?["']?([a-zA-Z\s-]+)["']?/i;
    const tagMatch = text.match(tagPattern);
    if (tagMatch) {
      filters.tags = [tagMatch[1].trim()];
      confidence += 0.8;
      filterCount++;
    }

    return {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      confidence: filterCount > 0 ? confidence / filterCount : 0
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  applyFilters(filters: any): Client[] {
    return this.clients.filter(client => {
      // Status filter
      if (filters.status && !filters.status.includes(client.status)) {
        return false;
      }

      // Lead filters
      if (filters.minLeads && client.leads < filters.minLeads) {
        return false;
      }
      if (filters.maxLeads && client.leads > filters.maxLeads) {
        return false;
      }

      // Delivery method filter
      if (filters.deliveryMethod && !filters.deliveryMethod.includes(client.deliveryMethod)) {
        return false;
      }

      // Tag filter
      if (filters.tags && !filters.tags.some((tag: string) => 
        client.tags.some(clientTag => 
          clientTag.toLowerCase().includes(tag.toLowerCase())
        )
      )) {
        return false;
      }

      // Time-based filter
      if (filters.timeframe === 'recent') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (new Date(client.lastActivity) < weekAgo) {
          return false;
        }
      }

      return true;
    });
  }

  generateClientSummary(clients: Client[]): string {
    if (clients.length === 0) return "No clients match your criteria.";
    
    const statusCounts = clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalLeads = clients.reduce((sum, client) => sum + client.leads, 0);
    const avgLeads = Math.round(totalLeads / clients.length);

    const parts = [
      `Found ${clients.length} client${clients.length === 1 ? '' : 's'}:`
    ];

    if (statusCounts.Active) parts.push(`${statusCounts.Active} active`);
    if (statusCounts.Inactive) parts.push(`${statusCounts.Inactive} inactive`);
    if (statusCounts.Pending) parts.push(`${statusCounts.Pending} pending`);

    parts.push(`Total leads: ${totalLeads} (avg: ${avgLeads} per client)`);

    return parts.join(', ') + '.';
  }
}