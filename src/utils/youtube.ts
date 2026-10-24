/**
 * Robust YouTube URL and ID parser
 * Supports all YouTube URL formats:
 * - https://www.youtube.com/watch?v=ID
 * - https://m.youtube.com/watch?v=ID
 * - https://music.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/v/ID
 * - https://www.youtube.com/shorts/ID
 * - https://www.youtube.com/live/ID
 * - Direct 11-char ID (e.g. dQw4w9WgXcQ)
 */

export const extractYouTubeVideoId = (input: string): string | null => {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. YouTu.be short links: youtu.be/ID
  const shortMatch = trimmed.match(/(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }

  // 3. YouTube standard, mobile, music, embed, shorts, live
  const standardMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/i
  );
  if (standardMatch && standardMatch[1]) {
    return standardMatch[1];
  }

  // 4. Attribution link format
  const attrMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/attribution_link\?.*v%3D([a-zA-Z0-9_-]{11})/i
  );
  if (attrMatch && attrMatch[1]) {
    return attrMatch[1];
  }

  return null;
};

/**
 * Checks if a string contains any YouTube URL or ID
 */
export const containsYouTubeUrl = (input: string): boolean => {
  return Boolean(extractYouTubeVideoId(input));
};

/**
 * Build safe embed URL
 */
export const buildYouTubeEmbedUrl = (videoId: string, autoplay = true): string => {
  const ap = autoplay ? '1' : '0';
  return `https://www.youtube.com/embed/${videoId}?autoplay=${ap}&rel=0&modestbranding=1&enablejsapi=1`;
};
