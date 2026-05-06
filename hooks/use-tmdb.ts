import { useNetwork } from '@/context/network-context';
import { getCached, setCached } from '@/db/database';
import { tmdb } from '@/services/tmdb';
import type {
  TmdbCredits,
  TmdbGenre,
  TmdbMovie,
  TmdbMovieDetail, TmdbPersonDetail,
  TmdbReview,
  TmdbVideo,
  TmdbWatchProviderResult,
} from '@/services/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function useTmdbLanguage(): string {
  const { i18n } = useTranslation();
  return i18n.language === 'ru' ? 'ru-RU' : 'en-US';
}

export function useTrending() {
  const language = useTmdbLanguage();
  const { isConnected } = useNetwork();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = `trending_week_${language}`;
    setLoading(true);
    setError(null);

    if (!isConnected) {
      getCached<TmdbMovie[]>(key).then((cached) => {
        if (cached) setData(cached);
        else setError('No internet connection');
        setLoading(false);
      });
      return;
    }

    tmdb
      .getTrending('week', language)
      .then((res) => {
        setData(res.results);
        setCached(key, res.results);
      })
      .catch(async (err) => {
        const cached = await getCached<TmdbMovie[]>(key);
        if (cached) setData(cached);
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [language, isConnected]);

  return { data, loading, error };
}

export function usePopular() {
  const language = useTmdbLanguage();
  const { isConnected } = useNetwork();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = `popular_${language}`;
    setLoading(true);
    setError(null);

    if (!isConnected) {
      getCached<TmdbMovie[]>(key).then((cached) => {
        if (cached) setData(cached);
        setLoading(false);
      });
      return;
    }

    tmdb
      .getPopular(1, language)
      .then((res) => {
        setData(res.results);
        setCached(key, res.results);
      })
      .catch(async () => {
        const cached = await getCached<TmdbMovie[]>(key);
        if (cached) setData(cached);
      })
      .finally(() => setLoading(false));
  }, [language, isConnected]);

  return { data, loading, error };
}

export function useTopRated() {
  const language = useTmdbLanguage();
  const { isConnected } = useNetwork();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = `top_rated_${language}`;
    setLoading(true);
    setError(null);

    if (!isConnected) {
      getCached<TmdbMovie[]>(key).then((cached) => {
        if (cached) setData(cached);
        setLoading(false);
      });
      return;
    }

    tmdb
      .getTopRated(1, language)
      .then((res) => {
        setData(res.results);
        setCached(key, res.results);
      })
      .catch(async () => {
        const cached = await getCached<TmdbMovie[]>(key);
        if (cached) setData(cached);
      })
      .finally(() => setLoading(false));
  }, [language, isConnected]);

  return { data, loading, error };
}

export function useUpcoming() {
  const language = useTmdbLanguage();
  const { isConnected } = useNetwork();
  const [data, setData] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = `upcoming_${language}`;
    setLoading(true);
    setError(null);

    if (!isConnected) {
      getCached<TmdbMovie[]>(key).then((cached) => {
        if (cached) setData(cached);
        setLoading(false);
      });
      return;
    }

    tmdb
      .getUpcoming(1, language)
      .then((res) => {
        setData(res.results);
        setCached(key, res.results);
      })
      .catch(async () => {
        const cached = await getCached<TmdbMovie[]>(key);
        if (cached) setData(cached);
      })
      .finally(() => setLoading(false));
  }, [language, isConnected]);

  return { data, loading, error };
}

export function useMovieDetail(id: number) {
  const language = useTmdbLanguage();
  const { isConnected } = useNetwork();
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
    const key = `movie_detail_${id}_${language}`;
    setLoading(true);
    setError(null);

    type CachedDetail = {
      movie: TmdbMovieDetail;
      credits: TmdbCredits;
      videos: TmdbVideo[];
      reviews: TmdbReview[];
      watchProviders: TmdbWatchProviderResult | null;
      similar: TmdbMovie[];
    };

    if (!isConnected) {
      getCached<CachedDetail>(key).then((cached) => {
        if (cached) {
          setMovie(cached.movie);
          setCredits(cached.credits);
          setVideos(cached.videos);
          setReviews(cached.reviews);
          setWatchProviders(cached.watchProviders);
          setSimilar(cached.similar);
        } else {
          setError('No internet connection');
        }
        setLoading(false);
      });
      return;
    }

    Promise.all([
      tmdb.getMovieDetail(id, language),
      tmdb.getMovieCredits(id, language),
      tmdb.getMovieVideos(id, language),
      tmdb.getMovieReviews(id, language),
      tmdb.getMovieWatchProviders(id),
      tmdb.getSimilarMovies(id, 1, language),
    ])
      .then(([movieData, creditsData, videosData, reviewsData, providersData, similarData]) => {
        const region = language === 'ru-RU' ? 'RU' : 'US';
        const providers = providersData.results[region] ?? null;

        setMovie(movieData);
        setCredits(creditsData);
        setVideos(videosData.results);
        setReviews(reviewsData.results);
        setWatchProviders(providers);
        setSimilar(similarData.results);

        setCached(key, {
          movie: movieData,
          credits: creditsData,
          videos: videosData.results,
          reviews: reviewsData.results,
          watchProviders: providers,
          similar: similarData.results,
        });
      })
      .catch(async (err) => {
        const cached = await getCached<CachedDetail>(key);
        if (cached) {
          setMovie(cached.movie);
          setCredits(cached.credits);
          setVideos(cached.videos);
          setReviews(cached.reviews);
          setWatchProviders(cached.watchProviders);
          setSimilar(cached.similar);
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [id, language, isConnected]);

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
