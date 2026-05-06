// Social Sharing Service - Share to social networks
import { Share } from 'react-native';
import type { TmdbMovie, TmdbMovieDetail } from './types';

// ============================================
// SHARING SERVICE
// ============================================

/**
 * Интерфейс для Share API
 */
export interface ShareOptions {
  message: string;
  title?: string;
  url?: string;
}

/**
 * Делится контентом через нативный Share API
 * Работает на iOS и Android
 * @param options опции для шаринга
 * @returns true если успешно
 */
export async function shareViaReactNative(options: ShareOptions): Promise<boolean> {
  try {
    const result = await Share.share({
      message: options.message,
      title: options.title,
      url: options.url,
    });

    if (result.action === Share.sharedAction) {
      // Пользователь поделился
      return true;
    } else if (result.action === Share.dismissedAction) {
      // Пользователь отменил
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
}

/**
 * Универсальная функция шаринга фильма
 * @param movie объект фильма
 * @returns true если шаринг успешен
 */
export async function shareMovieUniversal(movie: TmdbMovie | TmdbMovieDetail): Promise<boolean> {
  const title = 'title' in movie ? movie.title : movie.name || 'Movie';
  const rating = movie.vote_average ? ` ⭐ ${movie.vote_average.toFixed(1)}/10` : '';
  const year = 'release_date' in movie && movie.release_date 
    ? ` (${movie.release_date.split('-')[0]})` 
    : '';
  
  const message = `Check out this movie: ${title}${year}${rating}\n\nWatch it now! 🎬`;

  return await shareViaReactNative({
    message,
    title: `Share ${title}`,
  });
}

/**
 * Создаёт текст для шаринга списка фильмов
 * @param movies массив фильмов
 * @param listName название списка
 * @returns текст для шаринга
 */
export function createWatchlistShareText(movies: TmdbMovie[], listName: string): string {
  const movieList = movies
    .slice(0, 5) // Берём первые 5 фильмов
    .map((m, i) => `${i + 1}. ${m.title} ⭐ ${m.vote_average.toFixed(1)}`)
    .join('\n');

  const moreText = movies.length > 5 ? `\n...and ${movies.length - 5} more!` : '';

  return `My ${listName}:\n\n${movieList}${moreText}\n\n🎬 Check out these movies!`;
}

/**
 * Создаёт текст для шаринга статистики профиля
 * @param watchedCount количество просмотренных фильмов
 * @param hoursWatched количество часов просмотра
 * @param topGenres топ жанров
 * @returns текст для шаринга
 */
export function createProfileStatsShareText(
  watchedCount: number,
  hoursWatched: number,
  topGenres: string[]
): string {
  const genresText = topGenres.length > 0 
    ? `\nFavorite genres: ${topGenres.slice(0, 3).join(', ')}` 
    : '';

  return `My Movie Stats 🎬\n\n` +
    `📊 Watched: ${watchedCount} films\n` +
    `⏱️ Total time: ${hoursWatched} hours` +
    genresText +
    `\n\nJoin me in tracking your movies!`;
}
