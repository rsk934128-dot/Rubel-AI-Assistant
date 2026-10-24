/**
 * YouTube Data API v3 Service
 * Supports fetching the authenticated user's channel details, videos, playlists, statistics, and search.
 * Uses client-side OAuth Bearer token authenticated via Firebase GoogleAuthProvider.
 */

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
  statistics: {
    viewCount?: string;
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    videoCount?: string;
  };
  uploadsPlaylistId?: string;
  country?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
    maxres?: { url: string };
  };
  channelTitle: string;
  channelId?: string;
  viewCount?: string;
  likeCount?: string;
  duration?: string;
  url: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
  itemCount: number;
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetch the authenticated user's YouTube Channel
 */
export async function getMyYouTubeChannel(token: string): Promise<YouTubeChannel | null> {
  const url = `${YOUTUBE_API_BASE}/channels?part=snippet,contentDetails,statistics&mine=true`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error('YouTube সেশন মেয়াদোত্তীর্ণ হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।');
    }
    if (response.status === 403) {
      throw new Error('YouTube এপিআই অনুমতি বা কোটা অ্যাক্সেস প্রয়োজন।');
    }
    throw new Error(`YouTube API ত্রুটি (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const items = data.items || [];
  if (items.length === 0) {
    return null;
  }

  const item = items[0];
  return {
    id: item.id,
    title: item.snippet?.title || 'My YouTube Channel',
    description: item.snippet?.description || '',
    customUrl: item.snippet?.customUrl,
    publishedAt: item.snippet?.publishedAt || '',
    thumbnails: item.snippet?.thumbnails || {},
    statistics: {
      viewCount: item.statistics?.viewCount,
      subscriberCount: item.statistics?.subscriberCount,
      hiddenSubscriberCount: item.statistics?.hiddenSubscriberCount,
      videoCount: item.statistics?.videoCount,
    },
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
    country: item.snippet?.country,
  };
}

/**
 * Fetch videos from the channel's uploads playlist
 */
export async function getChannelUploads(
  token: string,
  uploadsPlaylistId: string,
  maxResults = 24
): Promise<YouTubeVideo[]> {
  const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
    uploadsPlaylistId
  )}&maxResults=${maxResults}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ভিডিও তালিকা লোড করা যায়নি (${response.status})`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item: any) => {
    const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
    return {
      id: videoId,
      title: item.snippet?.title || 'Untitled Video',
      description: item.snippet?.description || '',
      publishedAt: item.snippet?.publishedAt || '',
      thumbnails: item.snippet?.thumbnails || {},
      channelTitle: item.snippet?.channelTitle || '',
      channelId: item.snippet?.channelId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  });
}

/**
 * Fetch user's personal playlists
 */
export async function getMyPlaylists(token: string, maxResults = 25): Promise<YouTubePlaylist[]> {
  const url = `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&mine=true&maxResults=${maxResults}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`প্লেলিস্ট তালিকা আনতে ব্যর্থ (${response.status})`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item: any) => ({
    id: item.id,
    title: item.snippet?.title || 'Untitled Playlist',
    description: item.snippet?.description || '',
    publishedAt: item.snippet?.publishedAt || '',
    thumbnails: item.snippet?.thumbnails || {},
    itemCount: item.contentDetails?.itemCount || 0,
  }));
}

/**
 * Search YouTube videos
 */
export async function searchYouTubeVideos(
  token: string,
  queryText: string,
  maxResults = 20
): Promise<YouTubeVideo[]> {
  const url = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(
    queryText
  )}&type=video&maxResults=${maxResults}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`সার্চ ফলাফল পাওয়া যায়নি (${response.status})`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item: any) => {
    const videoId = item.id?.videoId;
    return {
      id: videoId,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      publishedAt: item.snippet?.publishedAt || '',
      thumbnails: item.snippet?.thumbnails || {},
      channelTitle: item.snippet?.channelTitle || '',
      channelId: item.snippet?.channelId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  });
}

/**
 * Format numbers into concise human-readable numbers (e.g. 1.2K, 3.4M)
 */
export function formatCountCompact(numStr?: string | number): string {
  if (!numStr) return '0';
  const n = typeof numStr === 'string' ? parseInt(numStr, 10) : numStr;
  if (isNaN(n)) return '0';

  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString('bn-BD');
}

/**
 * Format ISO date string into readable Bengali / English string
 */
export function formatPublishDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
