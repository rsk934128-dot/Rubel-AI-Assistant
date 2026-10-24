import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ChatResearchContext {
  sessionTitle?: string;
  currentPrompt?: string;
  topics?: string[];
  urls?: Array<{ url: string; title?: string }>;
}

export type MiniBrowserTab = 'search' | 'youtube' | 'web' | 'lyrics' | 'resources';

export interface MiniBrowserContextType {
  isOpen: boolean;
  activeUrl: string;
  searchQuery: string;
  activeVideoId?: string;
  activeVideoTitle?: string;
  activeTab: MiniBrowserTab;
  chatContext: ChatResearchContext | null;
  setActiveTab: (tab: MiniBrowserTab) => void;
  openBrowser: (
    urlOrQuery?: string,
    tab?: MiniBrowserTab,
    context?: ChatResearchContext
  ) => void;
  openYouTubeInBrowser: (videoId: string, title?: string, originalUrl?: string) => void;
  closeBrowser: () => void;
  setSearchQuery: (query: string) => void;
  setActiveUrl: (url: string) => void;
  setChatContext: (context: ChatResearchContext | null) => void;
}

const MiniBrowserContext = createContext<MiniBrowserContextType | undefined>(undefined);

export const MiniBrowserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState('https://www.google.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideoId, setActiveVideoId] = useState<string | undefined>(undefined);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<MiniBrowserTab>('search');
  const [chatContext, setChatContext] = useState<ChatResearchContext | null>(null);

  const openBrowser = useCallback((
    urlOrQuery?: string,
    tab: MiniBrowserTab = 'search',
    context?: ChatResearchContext
  ) => {
    if (context) {
      setChatContext(context);
    }
    if (urlOrQuery) {
      const trimmed = urlOrQuery.trim();
      // If it's a google domain, default to the search engine tab
      if (/^https?:\/\/(?:www\.)?google\.[a-z.]+(?:\/)?$/i.test(trimmed)) {
        setActiveTab('search');
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        setActiveUrl(trimmed);
        const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
        if (ytMatch) {
          setActiveVideoId(ytMatch[1]);
          setActiveTab('youtube');
        } else {
          setActiveTab(tab === 'search' ? 'web' : tab);
        }
      } else if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
        // Plain domain typed by user (e.g. wikipedia.org, bbc.com)
        const fullUrl = `https://${trimmed}`;
        setActiveUrl(fullUrl);
        setActiveTab('web');
      } else {
        setSearchQuery(trimmed);
        setActiveTab('search');
      }
    } else {
      setActiveTab(tab);
    }
    setIsOpen(true);
  }, []);

  const openYouTubeInBrowser = useCallback((videoId: string, title?: string, originalUrl?: string) => {
    setActiveVideoId(videoId);
    setActiveVideoTitle(title || 'ইউটিউব ভিডিও / গান');
    setActiveUrl(originalUrl || `https://www.youtube.com/watch?v=${videoId}`);
    setSearchQuery(title || '');
    setActiveTab('youtube');
    setIsOpen(true);
  }, []);

  const closeBrowser = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <MiniBrowserContext.Provider
      value={{
        isOpen,
        activeUrl,
        searchQuery,
        activeVideoId,
        activeVideoTitle,
        activeTab,
        setActiveTab,
        chatContext,
        setChatContext,
        openBrowser,
        openYouTubeInBrowser,
        closeBrowser,
        setSearchQuery,
        setActiveUrl,
      }}
    >
      {children}
    </MiniBrowserContext.Provider>
  );
};

export const useMiniBrowser = (): MiniBrowserContextType => {
  const context = useContext(MiniBrowserContext);
  if (!context) {
    throw new Error('useMiniBrowser must be used within a MiniBrowserProvider');
  }
  return context;
};
