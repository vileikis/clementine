import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';


initializeApp();

// Export commonly used services
export const db = getFirestore();
export const storage = getStorage();

export { FieldValue };


