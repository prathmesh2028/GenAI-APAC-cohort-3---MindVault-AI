import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Conversation, WeeklyReflection, ChatMessage } from '../types';

/**
 * Fetches all saved conversations for the authenticated user.
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const collPath = `users/${userId}/conversations`;
  try {
    const collRef = collection(db, 'users', userId, 'conversations');
    const q = query(collRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Conversation',
        summary: data.summary || '',
        messages: data.messages || [],
        topics: data.topics || [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
    return [];
  }
}

/**
 * Saves or updates a conversation in Firestore under users/{userId}/conversations/{id}.
 */
export async function saveConversation(
  userId: string,
  conversationId: string,
  data: {
    title: string;
    summary: string;
    messages: ChatMessage[];
    topics: string[];
    isNew?: boolean;
  }
): Promise<void> {
  const docPath = `users/${userId}/conversations/${conversationId}`;
  try {
    const docRef = doc(db, 'users', userId, 'conversations', conversationId);
    await setDoc(
      docRef,
      {
        id: conversationId,
        userId,
        title: data.title,
        summary: data.summary,
        messages: data.messages,
        topics: data.topics,
        updatedAt: serverTimestamp(),
        createdAt: data.isNew ? serverTimestamp() : undefined,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Deletes a conversation belonging to the user.
 */
export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const docPath = `users/${userId}/conversations/${conversationId}`;
  try {
    const docRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Fetches all saved weekly reflections for the authenticated user.
 */
export async function getUserReflections(userId: string): Promise<WeeklyReflection[]> {
  const collPath = `users/${userId}/reflections`;
  try {
    const collRef = collection(db, 'users', userId, 'reflections');
    const q = query(collRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId || userId,
        weekStartDate: data.weekStartDate || new Date().toISOString().split('T')[0],
        topics: data.topics || [],
        learned: data.learned || '',
        patterns: data.patterns || '',
        nextSteps: data.nextSteps || [],
        motivationalInsight: data.motivationalInsight || '',
        conversationCount: data.conversationCount || 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
    return [];
  }
}

/**
 * Saves an AI Weekly Reflection under users/{userId}/reflections/{reflectionId}.
 */
export async function saveWeeklyReflection(
  userId: string,
  reflectionId: string,
  data: Omit<WeeklyReflection, 'id' | 'userId' | 'createdAt'>
): Promise<void> {
  const docPath = `users/${userId}/reflections/${reflectionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'reflections', reflectionId);
    await setDoc(docRef, {
      ...data,
      id: reflectionId,
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}
