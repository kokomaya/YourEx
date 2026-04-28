import type { ChapterMapData } from './mapMessages';

export interface IMapDataSource {
  getChapters(): ChapterMapData[];
  isCertificateUnlocked(): boolean;
  hasAnyProgress(): boolean;
}
