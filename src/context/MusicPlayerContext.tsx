import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { MusicTrack } from '../types';
import { extractYouTubeVideoId } from '../utils/youtube';
import { CURATED_YOUTUBE_TRACKS, getTimeOfDayPeriod } from '../utils/dynamicMusicFeed';

export interface PlayVideoOptions {
  autoPlay?: boolean;
  startMinimized?: boolean;
  searchQuery?: string;
  category?: string;
  artist?: string;
  thumbnail?: string;
  duration?: string;
}

const HISTORY_STORAGE_KEY = 'ai_studio_music_history_v2';
const FAVORITES_STORAGE_KEY = 'ai_studio_music_favorites_v2';
const AUTOPLAY_STORAGE_KEY = 'ai_studio_music_autoplay_v2';
const MAX_HISTORY_ITEMS = 60;

export interface MusicPlayerContextType {
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  history: MusicTrack[];
  favorites: MusicTrack[];
  currentIndex: number;
  isOpen: boolean;
  isMinimized: boolean;
  isStreaming: boolean;
  autoplay: boolean;
  loopMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  playTrack: (track: MusicTrack, options?: PlayVideoOptions) => void;
  playVideoId: (videoIdOrUrl: string, title?: string, options?: PlayVideoOptions) => void;
  playQueue: (tracks: MusicTrack[], startIndex?: number, options?: PlayVideoOptions) => void;
  addToQueue: (track: MusicTrack) => void;
  playNextTrackInQueue: (track: MusicTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleAutoplay: () => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  toggleFavorite: (track: MusicTrack) => void;
  isFavorite: (videoId: string) => boolean;
  clearHistory: () => void;
  reListenHistory: (shuffle?: boolean) => void;
  onTrackEnded: () => void;
  closePlayer: () => void;
  minimizePlayer: () => void;
  expandPlayer: () => void;
  toggleMinimize: () => void;
  stopStreaming: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loopMode, setLoopMode] = useState<'off' | 'all' | 'one'>('all');
  const [isShuffle, setIsShuffle] = useState(false);

  // Autoplay enabled by default (User request: একের পর এক ভিডিওগুলো নিজে চলতে থাকবে)
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTOPLAY_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    } catch (_) {}
    return true;
  });

  // Listening History (গান শোনার হিস্ট্রি / পুনরায় শোনার তালিকা)
  const [history, setHistory] = useState<MusicTrack[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse music history:', e);
    }
    return [];
  });

  // Favorite Songs (পছন্দের গান)
  const [favorites, setFavorites] = useState<MusicTrack[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse music favorites:', e);
    }
    return [];
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (_) {}
  }, [history]);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (_) {}
  }, [favorites]);

  // Save autoplay to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(autoplay));
    } catch (_) {}
  }, [autoplay]);

  /**
   * Helper to append a track to listening history
   */
  const recordTrackToHistory = useCallback((track: MusicTrack) => {
    if (!track.videoId && !track.title) return;
    const item: MusicTrack = {
      ...track,
      playedAt: Date.now(),
      thumbnail: track.thumbnail || (track.videoId ? `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg` : undefined),
    };

    setHistory((prev) => {
      // Remove any existing duplicate of this videoId to bring it to top
      const filtered = prev.filter((p) => (track.videoId ? p.videoId !== track.videoId : p.title !== track.title));
      return [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  /**
   * Play any full queue / playlist of tracks
   */
  const playQueue = useCallback(
    (tracks: MusicTrack[], startIndex = 0, options?: PlayVideoOptions) => {
      if (!tracks || tracks.length === 0) return;
      const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
      const target = tracks[safeIndex];

      setQueue(tracks);
      setCurrentIndex(safeIndex);
      setCurrentTrack(target);
      setIsStreaming(true);
      setIsOpen(true);
      if (options?.startMinimized) {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }

      recordTrackToHistory(target);
    },
    [recordTrackToHistory]
  );

  /**
   * Play single track
   */
  const playTrack = useCallback(
    (track: MusicTrack, options?: PlayVideoOptions) => {
      const cleanId = track.videoId
        ? extractYouTubeVideoId(track.videoId) || track.videoId
        : '';

      const resolvedTrack: MusicTrack = {
        ...track,
        videoId: cleanId,
        thumbnail: track.thumbnail || (cleanId ? `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg` : undefined),
        duration: options?.duration || track.duration,
        category: options?.category || track.category,
        artist: options?.artist || track.artist,
      };

      setCurrentTrack(resolvedTrack);
      setIsStreaming(true);
      setIsOpen(true);
      if (options?.startMinimized) {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }

      recordTrackToHistory(resolvedTrack);

      // If track is not in queue, insert it or prepare upcoming songs based on mood
      setQueue((prevQueue) => {
        const foundIdx = prevQueue.findIndex((q) => q.videoId && q.videoId === cleanId);
        if (foundIdx !== -1) {
          setCurrentIndex(foundIdx);
          return prevQueue;
        }

        // Add track and populate next tracks from time-of-day catalog if queue is small
        const period = getTimeOfDayPeriod();
        const recommended = (CURATED_YOUTUBE_TRACKS[period] || []).filter((t) => t.videoId !== cleanId);
        const newQueue = [resolvedTrack, ...recommended];
        setCurrentIndex(0);
        return newQueue;
      });
    },
    [recordTrackToHistory]
  );

  /**
   * Play direct YouTube Video ID or URL
   */
  const playVideoId = useCallback(
    (videoIdOrUrl: string, title?: string, options?: PlayVideoOptions) => {
      const raw = (videoIdOrUrl || '').trim();
      if (!raw) return;

      const detectedId = extractYouTubeVideoId(raw);
      const isDirectId = detectedId || (/^[a-zA-Z0-9_-]{11}$/.test(raw) ? raw : undefined);
      const resolvedTitle = title?.trim() || (isDirectId ? 'ইউটিউব মিউজিক স্ট্রিম' : raw);

      const track: MusicTrack = {
        videoId: isDirectId || '',
        title: resolvedTitle,
        artist: options?.artist || (isDirectId ? 'YouTube Music' : undefined),
        originalUrl: isDirectId
          ? `https://www.youtube.com/watch?v=${isDirectId}`
          : `https://www.youtube.com/results?search_query=${encodeURIComponent(raw)}`,
        searchQuery: options?.searchQuery || (isDirectId ? resolvedTitle : raw),
        thumbnail: isDirectId ? `https://i.ytimg.com/vi/${isDirectId}/hqdefault.jpg` : undefined,
        category: options?.category,
      };

      playTrack(track, options);
    },
    [playTrack]
  );

  /**
   * Add a song to the end of the upcoming queue
   */
  const addToQueue = useCallback((track: MusicTrack) => {
    setQueue((prev) => {
      const exists = prev.some((t) => t.videoId && t.videoId === track.videoId);
      if (exists) return prev;
      return [...prev, track];
    });
  }, []);

  /**
   * Add song to play immediately next after current song
   */
  const playNextTrackInQueue = useCallback((track: MusicTrack) => {
    setQueue((prev) => {
      const currentIdx = currentIndex >= 0 ? currentIndex : 0;
      const filtered = prev.filter((t) => t.videoId !== track.videoId);
      const nextQueue = [...filtered];
      nextQueue.splice(currentIdx + 1, 0, track);
      return nextQueue;
    });
  }, [currentIndex]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    setCurrentIndex((curr) => {
      if (index < curr) return curr - 1;
      return curr;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue(currentTrack ? [currentTrack] : []);
    setCurrentIndex(0);
  }, [currentTrack]);

  /**
   * Advance to the next song in the queue (অটোমেটিক পরবর্তী গান চালানো)
   */
  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (loopMode === 'one' && currentTrack) {
      // Re-trigger the same track
      recordTrackToHistory(currentTrack);
      return;
    }

    let nextIdx = currentIndex + 1;
    if (isShuffle && queue.length > 1) {
      nextIdx = Math.floor(Math.random() * queue.length);
      if (nextIdx === currentIndex) {
        nextIdx = (currentIndex + 1) % queue.length;
      }
    }

    if (nextIdx >= queue.length) {
      if (loopMode === 'all') {
        nextIdx = 0;
      } else {
        // Queue finished and loop is off: pull more songs from current time period!
        const period = getTimeOfDayPeriod();
        const fallbackSongs = CURATED_YOUTUBE_TRACKS[period] || [];
        if (fallbackSongs.length > 0) {
          setQueue(fallbackSongs);
          setCurrentIndex(0);
          setCurrentTrack(fallbackSongs[0]);
          recordTrackToHistory(fallbackSongs[0]);
          return;
        }
        return;
      }
    }

    const nextSong = queue[nextIdx];
    if (nextSong) {
      setCurrentIndex(nextIdx);
      setCurrentTrack(nextSong);
      setIsStreaming(true);
      recordTrackToHistory(nextSong);
    }
  }, [queue, currentIndex, loopMode, isShuffle, currentTrack, recordTrackToHistory]);

  /**
   * Go back to the previous song
   */
  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }
    const prevSong = queue[prevIdx];
    if (prevSong) {
      setCurrentIndex(prevIdx);
      setCurrentTrack(prevSong);
      setIsStreaming(true);
      recordTrackToHistory(prevSong);
    }
  }, [queue, currentIndex, recordTrackToHistory]);

  /**
   * Called when current song ends (either via YouTube postMessage or timer)
   * Autoplay ensures seamless video transition to the next song!
   */
  const onTrackEnded = useCallback(() => {
    if (autoplay) {
      nextTrack();
    }
  }, [autoplay, nextTrack]);

  const toggleAutoplay = useCallback(() => {
    setAutoplay((prev) => !prev);
  }, []);

  const toggleLoop = useCallback(() => {
    setLoopMode((prev) => {
      if (prev === 'all') return 'one';
      if (prev === 'one') return 'off';
      return 'all';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleFavorite = useCallback((track: MusicTrack) => {
    if (!track.videoId && !track.title) return;
    setFavorites((prev) => {
      const exists = prev.some((f) => (track.videoId ? f.videoId === track.videoId : f.title === track.title));
      if (exists) {
        return prev.filter((f) => (track.videoId ? f.videoId !== track.videoId : f.title !== track.title));
      }
      return [
        {
          ...track,
          isFavorite: true,
          thumbnail: track.thumbnail || (track.videoId ? `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg` : undefined),
        },
        ...prev,
      ];
    });
  }, []);

  const isFavorite = useCallback(
    (videoId: string) => {
      if (!videoId) return false;
      return favorites.some((f) => f.videoId === videoId);
    },
    [favorites]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (_) {}
  }, []);

  /**
   * Re-listen to all recently played songs in sequence or shuffle
   * (পুনরায় সব গান শোনার ব্যবস্থা)
   */
  const reListenHistory = useCallback(
    (shuffle = false) => {
      if (history.length === 0) return;
      const listToPlay = shuffle ? [...history].sort(() => Math.random() - 0.5) : [...history];
      playQueue(listToPlay, 0, { autoPlay: true });
    },
    [history, playQueue]
  );

  const closePlayer = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setIsStreaming(false);
    setCurrentTrack(null);
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    setIsOpen(false);
    setIsMinimized(false);
    setCurrentTrack(null);
  }, []);

  const minimizePlayer = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const expandPlayer = useCallback(() => {
    setIsMinimized(false);
    setIsOpen(true);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        history,
        favorites,
        currentIndex,
        isOpen,
        isMinimized,
        isStreaming,
        autoplay,
        loopMode,
        isShuffle,
        playTrack,
        playVideoId,
        playQueue,
        addToQueue,
        playNextTrackInQueue,
        removeFromQueue,
        clearQueue,
        nextTrack,
        prevTrack,
        toggleAutoplay,
        toggleLoop,
        toggleShuffle,
        toggleFavorite,
        isFavorite,
        clearHistory,
        reListenHistory,
        onTrackEnded,
        closePlayer,
        minimizePlayer,
        expandPlayer,
        toggleMinimize,
        stopStreaming,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
