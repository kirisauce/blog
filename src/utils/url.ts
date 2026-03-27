import path from "path/posix";

class UrlPrefixer {
  #base: string;

  constructor(base: string, subbase?: string) {
    if (subbase) {
      this.#base = path.resolve(base, subbase);
    } else {
      this.#base = base;
    }
  }

  with(target: string): string {
    return path.resolve(this.#base, target);
  }
}

export const blogurl = new UrlPrefixer(import.meta.env.BASE_URL, 'blog');
export const tagurl = new UrlPrefixer(import.meta.env.BASE_URL, 'tag')