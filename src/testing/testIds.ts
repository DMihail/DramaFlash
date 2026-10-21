import type { HomeGenre } from '@/features/home/model';

function homeGenreId(genre: HomeGenre) {
  switch (genre) {
    case 'All':
      return 'home.genre.all';
    case 'Romance':
      return 'home.genre.romance';
    case 'Drama':
      return 'home.genre.drama';
    case 'Action':
      return 'home.genre.action';
    case 'Mystery':
      return 'home.genre.mystery';
  }
}

export const testIds = {
  home: {
    screen: 'home.screen',
    watchNow: 'home.watchNow',
    save: 'home.save',
    search: 'home.search',
    notifications: 'home.notifications',
    profile: 'home.profile',
    poster: (seriesId: string) => `home.poster.${seriesId}`,
    genre: homeGenreId,
    seeAll: (railId: string) => `home.seeAll.${railId}`,
  },
  series: {
    screen: 'series.screen',
    loading: 'series.loading',
    retry: 'series.retry',
    back: 'series.back',
    share: 'series.share',
    save: 'series.save',
    title: 'series.title',
    play: 'series.play',
    sort: 'series.sort',
    episode: (episode: number) => `series.episode.${episode}`,
  },
  player: {
    screen: 'player.screen',
    loading: 'player.loading',
    back: 'player.back',
    error: 'player.error',
    retry: 'player.retry',
    episodes: 'player.episodes',
    locked: 'player.locked',
    save: 'player.save',
    comments: 'player.comments',
    share: 'player.share',
    episode: 'player.episode',
    unlock: 'player.unlock',
    play: 'player.play',
    pause: 'player.pause',
    previous: 'player.previous',
    next: 'player.next',
  },
  coins: {
    store: 'coins.store',
  },
} as const;
