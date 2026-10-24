/**
 * Google Drive API Service
 * Handles listing, searching, previewing, uploading, creating, and deleting Google Drive files.
 * Uses client-side OAuth Bearer token authenticated via Firebase GoogleAuthProvider.
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  shared?: boolean;
  owners?: { displayName: string; emailAddress?: string }[];
  isFolder?: boolean;
}

export interface DriveQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  userDisplayName?: string;
  userEmail?: string;
  userPhoto?: string;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export function isFolder(mimeType: string): boolean {
  return mimeType === 'application/vnd.google-apps.folder';
}

export function isGoogleDoc(mimeType: string): boolean {
  return mimeType === 'application/vnd.google-apps.document';
}

export function isGoogleSheet(mimeType: string): boolean {
  return mimeType === 'application/vnd.google-apps.spreadsheet';
}

export function isGoogleSlides(mimeType: string): boolean {
  return mimeType === 'application/vnd.google-apps.presentation';
}

export function formatFileSize(bytes?: string | number): string {
  if (!bytes) return '';
  const n = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(n) || n === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i] || 'B'}`;
}

export function getFileCategory(mimeType: string): 'folder' | 'doc' | 'sheet' | 'slide' | 'pdf' | 'image' | 'code' | 'video' | 'audio' | 'other' {
  if (isFolder(mimeType)) return 'folder';
  if (isGoogleDoc(mimeType) || mimeType.includes('word') || mimeType.includes('document')) return 'doc';
  if (isGoogleSheet(mimeType) || mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'sheet';
  if (isGoogleSlides(mimeType) || mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slide';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('text/') ||
    mimeType.includes('json') ||
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('html') ||
    mimeType.includes('xml')
  ) return 'code';
  return 'other';
}

/**
 * Lists or searches files in Google Drive
 */
export async function listDriveFiles(
  token: string,
  options?: {
    folderId?: string;
    searchQuery?: string;
    categoryFilter?: string;
    pageSize?: number;
  }
): Promise<DriveFile[]> {
  const queryParts: string[] = ['trashed = false'];

  if (options?.folderId) {
    queryParts.push(`'${options.folderId}' in parents`);
  }

  if (options?.searchQuery?.trim()) {
    const escaped = options.searchQuery.replace(/'/g, "\\'");
    queryParts.push(`(name contains '${escaped}' or fullText contains '${escaped}')`);
  }

  if (options?.categoryFilter && options.categoryFilter !== 'all') {
    switch (options.categoryFilter) {
      case 'folders':
        queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
        break;
      case 'docs':
        queryParts.push("(mimeType = 'application/vnd.google-apps.document' or mimeType contains 'word' or mimeType contains 'text')");
        break;
      case 'sheets':
        queryParts.push("(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType contains 'spreadsheet' or mimeType contains 'excel' or mimeType contains 'csv')");
        break;
      case 'slides':
        queryParts.push("(mimeType = 'application/vnd.google-apps.presentation' or mimeType contains 'presentation')");
        break;
      case 'pdfs':
        queryParts.push("mimeType = 'application/pdf'");
        break;
      case 'images':
        queryParts.push("mimeType contains 'image/'");
        break;
      case 'media':
        queryParts.push("(mimeType contains 'video/' or mimeType contains 'audio/')");
        break;
    }
  }

  const q = encodeURIComponent(queryParts.join(' and '));
  const fields = encodeURIComponent('files(id,name,mimeType,iconLink,thumbnailLink,webViewLink,webContentLink,size,createdTime,modifiedTime,shared,owners),nextPageToken');
  const pageSize = options?.pageSize || 60;
  const url = `${DRIVE_API_BASE}/files?q=${q}&fields=${fields}&pageSize=${pageSize}&orderBy=folder,modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Google Drive API error (${res.status})`);
  }

  const data = await res.json();
  const rawFiles = data.files || [];

  return rawFiles.map((f: any) => ({
    ...f,
    isFolder: isFolder(f.mimeType),
  }));
}

/**
 * Fetches text content of a file or exports a Google Doc / Sheet / Slide into readable text
 */
export async function getFileTextContent(
  token: string,
  file: DriveFile
): Promise<{ text: string; isExported: boolean }> {
  // If it's a native Google Doc, export as plain text
  if (isGoogleDoc(file.mimeType)) {
    const res = await fetch(`${DRIVE_API_BASE}/files/${file.id}/export?mimeType=text/plain`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Could not export Google Doc: ${res.statusText}`);
    const text = await res.text();
    return { text, isExported: true };
  }

  // If it's a Google Sheet, export as CSV
  if (isGoogleSheet(file.mimeType)) {
    const res = await fetch(`${DRIVE_API_BASE}/files/${file.id}/export?mimeType=text/csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Could not export Google Sheet: ${res.statusText}`);
    const text = await res.text();
    return { text, isExported: true };
  }

  // If it's a Google Slide, export as text
  if (isGoogleSlides(file.mimeType)) {
    const res = await fetch(`${DRIVE_API_BASE}/files/${file.id}/export?mimeType=text/plain`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Could not export Google Slide: ${res.statusText}`);
    const text = await res.text();
    return { text, isExported: true };
  }

  // For regular binary files like images, pdf, video, return notice
  if (
    file.mimeType.startsWith('image/') ||
    file.mimeType.startsWith('video/') ||
    file.mimeType.startsWith('audio/') ||
    file.mimeType === 'application/pdf'
  ) {
    return {
      text: `[Google Drive Media: ${file.name} (${file.mimeType})]\nভিউ লিঙ্ক: ${file.webViewLink || 'ড্রাইভে দেখুন'}`,
      isExported: false,
    };
  }

  // Download media directly for text/code/markdown/json files
  const res = await fetch(`${DRIVE_API_BASE}/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Could not download file content: ${res.statusText}`);
  const text = await res.text();
  return { text, isExported: false };
}

/**
 * Uploads a local file to Google Drive using multipart upload
 */
export async function uploadLocalFileToDrive(
  token: string,
  file: File,
  parentFolderId?: string
): Promise<DriveFile> {
  const metadata: any = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const fileData = await fileDataPromise;

  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const fileBlob = new Blob([fileData], { type: metadata.mimeType });

  const multipartBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadataBlob,
    delimiter,
    `Content-Type: ${metadata.mimeType}\r\n\r\n`,
    fileBlob,
    closeDelimiter,
  ]);

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,iconLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Upload failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * Saves markdown or text content as a new file in Google Drive
 */
export async function createDriveTextFile(
  token: string,
  name: string,
  content: string,
  mimeType: string = 'text/markdown',
  parentFolderId?: string
): Promise<DriveFile> {
  const metadata: any = {
    name,
    mimeType,
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const contentBlob = new Blob([content], { type: mimeType });

  const multipartBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadataBlob,
    delimiter,
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n`,
    contentBlob,
    closeDelimiter,
  ]);

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,iconLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create file: ${res.status}`);
  }

  return await res.json();
}

/**
 * Creates a new folder in Google Drive
 */
export async function createDriveFolder(
  token: string,
  name: string,
  parentFolderId?: string
): Promise<DriveFile> {
  const body: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    body.parents = [parentFolderId];
  }

  const res = await fetch(`${DRIVE_API_BASE}/files?fields=id,name,mimeType,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Folder creation failed (${res.status})`);
  }

  return await res.json();
}

/**
 * Deletes a file from Google Drive.
 * CRITICAL: This is a destructive operation and MUST only be called AFTER explicit user confirmation dialog in the UI!
 */
export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Drive (${res.status})`);
  }
}

/**
 * Retrieves the user's Google Drive storage quota and profile info
 */
export async function getDriveAbout(token: string): Promise<DriveQuota> {
  const res = await fetch(`${DRIVE_API_BASE}/about?fields=storageQuota,user`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return {};
  const data = await res.json();

  return {
    limit: data.storageQuota?.limit ? formatFileSize(data.storageQuota.limit) : 'সীমাহীন',
    usage: data.storageQuota?.usage ? formatFileSize(data.storageQuota.usage) : '0 B',
    usageInDrive: data.storageQuota?.usageInDrive ? formatFileSize(data.storageQuota.usageInDrive) : '0 B',
    userDisplayName: data.user?.displayName,
    userEmail: data.user?.emailAddress,
    userPhoto: data.user?.photoLink,
  };
}
