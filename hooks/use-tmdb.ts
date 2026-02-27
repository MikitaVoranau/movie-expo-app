import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tmdb } from '@/services/tmdb';
import type {
  TmdbMovie,
  TmdbMovieDetail,
  TmdbCredits,
  TmdbVideo,
  TmdbReview,
  TmdbWatchProviderResult,
  TmdbGenre,
  TmdbPersonDetail,
} from '@/services/types';

function useTmdbLanguage(): string {
  const { i18n } = useTranslation();
  return i18n.language === 'ru' ? 'ru-RU' : 'en-US';
}



export function useTrending() {
  const language = useTmdbLanguage();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    tmdb
      .getTrending('week', language)
      .then((res) => setData(res.results))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [language]);

  return { data, loading, error };
}

export function usePopular() {
  const language = useTmdbLanguage();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    tmdb
      .getPopular(1, language)
      .then((res) => setData(res.results))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [language]);

  return { data, loading, error };
}

export function useTopRated() {
  const language = useTmdbLanguage();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    tmdb
      .getTopRated(1, language)
      .then((res) => setData(res.results))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [language]);

  return { data, loading, error };
}

export function useUpcoming() {
  const language = useTmdbLanguage();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    tmdb
      .getUpcoming(1, language)
      .then((res) => setData(res.results))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [language]);

  return { data, loading, error };
}



export function useMovieDetail(id: number) {
  const language = useTmdbLanguage();
  const [movie, setMovie] = useState<TmdbMovieDetail | null>(null);
  const [credits, setCredits] = useState<TmdbCredits | null>(null);
  const [videos, setVideos] = useState<TmdbVideo[]>([]);
  const [reviews, setReviews] = useState<TmdbReview[]>([]);
  const [watchProviders, setWatchProviders] = useState<TmdbWatchProviderResult | null>(null);
  const [similar, setSimilar] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      tmdb.getMovieDetail(id, language),
      tmdb.getMovieCredits(id, language),
      tmdb.getMovieVideos(id, language),
      tmdb.getMovieReviews(id, language),
      tmdb.getMovieWatchProviders(id),
      tmdb.getSimilarMovies(id, 1, language),
    ])
      .then(([movieData, creditsData, videosData, reviewsData, providersData, similarData]) => {
        setMovie(movieData);
        setCredits(creditsData);
        setVideos(videosData.results);
        setReviews(reviewsData.results);
        
        const region = language === 'ru-RU' ? 'RU' : 'US';
        setWatchProviders(providersData.results[region] ?? null);
        setSimilar(similarData.results);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, language]);

  return { movie, credits, videos, reviews, watchProviders, similar, loading, error };
}



export function useSearch(query: string) {
  const language = useTmdbLanguage();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    tmdb
      .searchMovies(query, 1, language)
      .then((res) => setData(res.results))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, language]);

  return { data, loading, error };
}



export function useMovieGenres() {
  const language = useTmdbLanguage();
  const [data, setData] = useState<TmdbGenre[]>([]);

  useEffect(() => {
    tmdb
      .getMovieGenres(language)
      .then((res) => setData(res.genres))
      .catch(() => {});
  }, [language]);

  return { data };
}



export function useDiscover(genreIds: string[], filters?: Record<string, string>) {
  const language = useTmdbLanguage();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = { ...filters };
    if (genreIds.length > 0) {
      params.with_genres = genreIds.join(',');
    }

    setLoading(true);
    setError(null);
    tmdb
      .discoverMovies(params, language)
      .then((res) => setData(res.results))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [genreIds.join(','), language, JSON.stringify(filters)]);

  return { data, loading, error };
}



export function usePersonDetail(id: number) {
  const language = useTmdbLanguage();
  const [person, setPerson] = useState<TmdbPersonDetail | null>(null);
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      tmdb.getPersonDetail(id, language),
      tmdb.getPersonMovieCredits(id, language),
    ])
      .then(([personData, creditsData]) => {
        setPerson(personData);
        setMovies(creditsData.cast.sort((a, b) => b.popularity - a.popularity));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, language]);

  return { person, movies, loading, error };
}
