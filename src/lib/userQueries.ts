import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface InactiveUserRecord {
  id: string;
  email?: string;
  displayName?: string;
  status?: string;
  lastLoginAt?: Timestamp | string | number;
  createdAt?: string | number;
  [key: string]: any;
}

/**
 * Genkit Flow / Admin Query: Retrieve inactive users who have not logged in
 * within a specified threshold (default: 7 days) but maintain 'active' status.
 *
 * NOTE: Cloud Firestore requires a composite index for this compound query:
 * - Collection: `users`
 * - Fields: `status` (Ascending) + `lastLoginAt` (Ascending)
 *
 * @param daysThreshold Number of days of inactivity (default: 7)
 * @param maxResults Optional limit for pagination/batch safety (default: 100)
 */
export async function getInactiveActiveUsers(
  daysThreshold: number = 7,
  maxResults: number = 100
): Promise<InactiveUserRecord[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

  const usersCollection = collection(db, 'users');

  // Optimized compound query with index
  const inactiveUsersQuery = query(
    usersCollection,
    where('status', '==', 'active'),
    where('lastLoginAt', '<', cutoffTimestamp),
    orderBy('lastLoginAt', 'asc'),
    limit(maxResults)
  );

  try {
    const snapshot = await getDocs(inactiveUsersQuery);
    const inactiveUsers: InactiveUserRecord[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`[RubelNet Genkit] Found ${inactiveUsers.length} inactive users (threshold: ${daysThreshold} days)`);
    return inactiveUsers;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);

    // Provide friendly diagnostics for composite index or security rules
    if (errorMsg.includes('requires an index') || error?.code === 'failed-precondition') {
      console.warn(
        '[RubelNet Firestore] Composite index required on `users` (status ASC, lastLoginAt ASC). Check Firebase Console link in error log.'
      );
    } else if (errorMsg.includes('permission-denied') || error?.code === 'permission-denied') {
      console.warn(
        '[RubelNet Firestore] Listing users requires admin privileges in firestore.rules or execution in backend admin environment.'
      );
    }

    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}
