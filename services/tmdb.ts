import type {
  TmdbCredits,
  TmdbGenre,
  TmdbMovie,
  TmdbMovieDetail,
  TmdbPaginatedResponse,
  TmdbPersonDetail,
  TmdbReview,
  TmdbVideo,
  TmdbWatchProviderResult,
} from './types';


const API_KEY = 'b6d600a0c0a03304f513bfd0504f3905';
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export function posterUrl(path: string | null, size = 'w500'): string | undefined {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : undefined;
}

export function backdropUrl(path: string | null, size = 'w1280'): string | undefined {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : undefined;
}

export function profileUrl(path: string | null, size = 'w185'): string | undefined {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : undefined;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const tmdb = {
  
  getTrending: (timeWindow: 'day' | 'week' = 'week', language = 'en-US') =>
    tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(`/trending/movie/${timeWindow}`, { language }),

  
  getPopular: (page = 1, language = 'en-US') =>
    tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>('/movie/popular', { page: String(page), language }),

  getTopRated: (page = 1, language = 'en-US') =>
    tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>('/movie/top_rated', { page: String(page), language }),

  getNowPlaying: (page = 1, language = 'en-US') =>
    tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>('/movie/now_playing', { page: String(page), language }),

  getUpcoming: (page = 1, language = 'en-US') =>
    tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>('/movie/upcoming', { page: String(page), language }),

  
  getMovieDetail: (id: number, language = 'en-US') =>
    tmdbFetch<TmdbMovieDetail>(`/movie/${id}`, { language }),

  getMovieCredits: (id: number, language = 'en-US') =>
    tmdbFetch<TmdbCredits>(`/movie/${id}/credits`, { language }),

  getMovieReviews: (id: number, language = 'en-US') =>
    tmdbFetch<TmdbPaginatedResponse<TmdbReview>>(`/movie/${id}/reviews`, { language }),

  getMovieVideos: (id: number, language = 'en-US') =>
    tmdbFetch<{ results: TmdbVideo[] }>(`/movie/${id}/videos`, { language }),

  getMovieWatchProviders: (id: number) =>
    tmdbFetch<{ results: Record<string, TmdbWatchProviderResult> }>(`/movie/${id}/watch/providers`),

  getSimilarMovies: (id: number, page = 1, language = 'en-US') =>
    tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(`/movie/${id}/similar`, { page: String(page), language }),

  
  searchMovies: (query: string, page = 1, language = 'en-US') =>
    tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>('/search/movie', { query, page: String(page), language }),

  
  discoverMovies: (filters: Record<string, string>, language = 'en-US') =>
    tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>('/discover/movie', { ...filters, language }),

  
  getMovieGenres: (language = 'en-US') =>
    tmdbFetch<{ genres: TmdbGenre[] }>('/genre/movie/list', { language }),

  
  getPersonDetail: (id: number, language = 'en-US') =>
    tmdbFetch<TmdbPersonDetail>(`/person/${id}`, { language }),

  getPersonMovieCredits: (id: number, language = 'en-US') =>
    tmdbFetch<{ cast: TmdbMovie[]; crew: TmdbMovie[] }>(`/person/${id}/movie_credits`, { language }),
};
