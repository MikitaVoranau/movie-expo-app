import {
  addToList,
  createCollection,
  deleteCollection,
  getCollections,
  getListCounts,
  getListItems,
  isInList,
  removeFromList,
  type UserCollection,
  type UserListItem
} from '@/db/database';
import { useEffect, useState } from 'react';

export function useListItems(listType: string) {
  const [items, setItems] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await getListItems(listType);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [listType]);

  return { items, loading, refresh };
}

export function useIsInList(movieId: number, listType: string, onChange?: () => void) {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    if (movieId) {
      isInList(movieId, listType).then(setInList);
    }
  }, [movieId, listType]);

  const toggle = async (movieData: { title: string; poster_url: string | null }) => {
    if (inList) {
      await removeFromList(movieId, listType);
    } else {
      await addToList({
        movie_id: movieId,
        title: movieData.title,
        poster_url: movieData.poster_url,
        list_type: listType as UserListItem['list_type'],
        rating: null,
        notes: null,
      });
    }
    setInList(!inList);
    onChange?.();
  };

  return { inList, toggle };
}

export function useListCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const refresh = async () => {
    const data = await getListCounts();
    setCounts(data);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { counts, refresh };
}

export function useCollections() {
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await getCollections();
    setCollections(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async (name: string) => {
    await createCollection(name);
    await refresh();
  };

  const remove = async (id: number) => {
    await deleteCollection(id);
    await refresh();
  };

  return { collections, loading, refresh, create, remove };
}
