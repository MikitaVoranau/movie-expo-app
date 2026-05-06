// Firebase Realtime Updates Service
import type { UserCollection, UserListItem } from '@/db/database';
import { collection, doc, onSnapshot, query, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { RemoteProfile } from './firestore-sync';

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Подписывается на изменения профиля пользователя в реальном времени
 * @param uid ID пользователя
 * @param onUpdate callback, вызываемый при изменении профиля
 * @returns функция для отписки
 */
export function subscribeToProfile(
  uid: string,
  onUpdate: (profile: RemoteProfile | null) => void
): Unsubscribe {
  const profileRef = doc(db, 'users', uid, 'profile', 'data');

  return onSnapshot(
    profileRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as RemoteProfile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error subscribing to profile:', error);
      onUpdate(null);
    }
  );
}

/**
 * Подписывается на изменения списков фильмов в реальном времени
 * @param uid ID пользователя
 * @param onUpdate callback, вызываемый при изменении списков
 * @returns функция для отписки
 */
export function subscribeToLists(
  uid: string,
  onUpdate: (items: UserListItem[]) => void
): Unsubscribe {
  const listsRef = collection(db, 'users', uid, 'lists');
  const q = query(listsRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: UserListItem[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as UserListItem);
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Error subscribing to lists:', error);
      onUpdate([]);
    }
  );
}

/**
 * Подписывается на изменения коллекций в реальном времени
 * @param uid ID пользователя
 * @param onUpdate callback, вызываемый при изменении коллекций
 * @returns функция для отписки
 */
export function subscribeToCollections(
  uid: string,
  onUpdate: (collections: UserCollection[]) => void
): Unsubscribe {
  const collectionsRef = collection(db, 'users', uid, 'collections');
  const q = query(collectionsRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const collections: UserCollection[] = [];
      snapshot.forEach((doc) => {
        collections.push(doc.data() as UserCollection);
      });
      onUpdate(collections);
    },
    (error) => {
      console.error('Error subscribing to collections:', error);
      onUpdate([]);
    }
  );
}

/**
 * Подписывается на изменения конкретного списка (watchlist, favorites, etc.)
 * @param uid ID пользователя
 * @param listType тип списка
 * @param onUpdate callback, вызываемый при изменении списка
 * @returns функция для отписки
 */
export function subscribeToSpecificList(
  uid: string,
  listType: string,
  onUpdate: (items: UserListItem[]) => void
): Unsubscribe {
  const listsRef = collection(db, 'users', uid, 'lists');
  const q = query(listsRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: UserListItem[] = [];
      snapshot.forEach((doc) => {
        const item = doc.data() as UserListItem;
        if (item.list_type === listType) {
          items.push(item);
        }
      });
      onUpdate(items);
    },
    (error) => {
      console.error(`Error subscribing to ${listType}:`, error);
      onUpdate([]);
    }
  );
}

// ============================================
// BATCH SUBSCRIPTIONS
// ============================================

/**
 * Подписывается на все данные пользователя одновременно
 * @param uid ID пользователя
 * @param callbacks объект с callback-функциями для каждого типа данных
 * @returns функция для отписки от всех подписок
 */
export function subscribeToAllUserData(
  uid: string,
  callbacks: {
    onProfileUpdate?: (profile: RemoteProfile | null) => void;
    onListsUpdate?: (items: UserListItem[]) => void;
    onCollectionsUpdate?: (collections: UserCollection[]) => void;
  }
): () => void {
  const unsubscribers: Unsubscribe[] = [];

  if (callbacks.onProfileUpdate) {
    unsubscribers.push(subscribeToProfile(uid, callbacks.onProfileUpdate));
  }

  if (callbacks.onListsUpdate) {
    unsubscribers.push(subscribeToLists(uid, callbacks.onListsUpdate));
  }

  if (callbacks.onCollectionsUpdate) {
    unsubscribers.push(subscribeToCollections(uid, callbacks.onCollectionsUpdate));
  }

  // Возвращаем функцию, которая отписывается от всех подписок
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Проверяет, изменились ли данные
 * Используется для оптимизации - не обновляем состояние если данные не изменились
 */
export function hasDataChanged<T>(oldData: T, newData: T): boolean {
  return JSON.stringify(oldData) !== JSON.stringify(newData);
}

/**
 * Объединяет локальные и удалённые данные
 * Приоритет отдаётся данным с более поздним timestamp
 */
export function mergeWithTimestamp<T extends { updatedAt?: number }>(
  local: T,
  remote: T
): T {
  const localTime = local.updatedAt || 0;
  const remoteTime = remote.updatedAt || 0;

  return remoteTime > localTime ? remote : local;
}
