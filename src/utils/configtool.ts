import { author } from '../config';
import type { Author } from '../types/config-types';

export const getDefaultAuthor = (): Author | undefined => {
  return author.defaultAuthor
    ? author.authors[author.defaultAuthor]
    : undefined;
};
