import type { UserCollection, UserListItem } from '@/db/database';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    setDoc
} from 'firebase/firestore';
import { db } from './firebase';



export interface RemoteProfile {
  username: string;
  avatarUrl: string | null;
  updatedAt: number;
}

export async function saveProfileRemote(uid: string, profile: RemoteProfile): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'profile', 'data'), profile, { merge: true });
}

export async function loadProfileRemote(uid: string): Promise<RemoteProfile | null> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'users', uid, 'profile', 'data'));
  return snap.exists() ? (snap.data() as RemoteProfile) : null;
}



export async function saveListItemRemote(uid: string, item: UserListItem): Promise<void> {
  const id = `${item.movie_id}_${item.list_type.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  await setDoc(doc(db, 'users', uid, 'lists', id), {
    movie_id: item.movie_id,
    title: item.title,
    poster_url: item.poster_url,
    list_type: item.list_type,
    added_at: item.added_at,
    rating: item.rating ?? null,
    notes: item.notes ?? null,
  });
}

export async function removeListItemRemote(
  uid: string,
  movieId: number,
  listType: string
): Promise<void> {
  const id = `${movieId}_${listType.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  await deleteDoc(doc(db, 'users', uid, 'lists', id));
}

export async function loadAllListItemsRemote(uid: string): Promise<UserListItem[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'lists'));
  return snap.docs.map((d) => d.data() as UserListItem);
}



export async function saveCollectionRemote(uid: string, col: UserCollection): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'collections', String(col.id)), {
    id: col.id,
    name: col.name,
    created_at: col.created_at,
  });
}

export async function removeCollectionRemote(uid: string, colId: number): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'collections', String(colId)));
}

export async function loadAllCollectionsRemote(uid: string): Promise<UserCollection[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'collections'));
  return snap.docs.map((d) => d.data() as UserCollection);
}



export async function pullFromFirestore(
  uid: string,
  onItems: (items: UserListItem[]) => Promise<void>,
  onCollections: (cols: UserCollection[]) => Promise<void>,
  onProfile: (profile: RemoteProfile) => Promise<void>
): Promise<void> {
  const [items, cols, profile] = await Promise.all([
    loadAllListItemsRemote(uid),
    loadAllCollectionsRemote(uid),
    loadProfileRemote(uid),
  ]);

  if (items.length > 0) await onItems(items);
  if (cols.length > 0) await onCollections(cols);
  if (profile) await onProfile(profile);
}
