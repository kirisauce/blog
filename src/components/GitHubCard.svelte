<svelte:options
  customElement={{
    tag: 'github-card',
    shadow: 'none',
    props: {
      repo: { reflect: true, type: 'String' },
    },
  }}
/>

<script lang="ts">
  import GithubIcon from '~icons/mingcute/github-line';
  import StarIcon from '~icons/mingcute/star-line';
  import ForkIcon from '~icons/mdi/source-fork';
  import IssueIcon from '~icons/mdi/bug-outline';
  import LicenseIcon from '~icons/mdi/license';
  import AlertIcon from '~icons/mdi/alert-circle-outline';
  import RefreshIcon from '~icons/mingcute/refresh-1-fill';
  import ExternalLinkIcon from '~icons/mdi/external-link';

  let { repo = '' } = $props();

  type ErrKind = 'notfound' | 'ratelimit' | 'network' | 'http';

  interface RepoData {
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    license: string | null;
    language: string | null;
    updated_at: string;
    owner: { avatar_url: string };
  }

  interface CardError extends Error {
    kind: ErrKind;
    status?: number;
  }

  const API = 'https://api.github.com/repos';

  const LANG_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    Svelte: '#ff3e00',
    Vue: '#41b883',
    Astro: '#FF5A03',
    MDX: '#fcb32c',
    Stylus: '#ff6347',
    CSS: '#563d7c',
    HTML: '#e34c26',
    Shell: '#89e051',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Java: '#b07219',
    Kotlin: '#A97BFF',
    Swift: '#F05138',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Zig: '#ec915c',
    Lua: '#000080',
  };

  const ERR_MSG: Record<ErrKind, string> = {
    notfound: 'Repository not found',
    ratelimit: 'API rate limit exceeded',
    network: 'Network error',
    http: 'GitHub API error',
  };

  let phase = $state<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  let data = $state<RepoData | null>(null);
  let err = $state<CardError | null>(null);
  let spinning = $state(false);
  let el = $state<HTMLElement | null>(null);
  let lastRefresh = 0;

  // ── 缓存 ──────────────────────────────────────────────────────────

  interface CachedError { kind: ErrKind; status?: number; }
  interface CacheEntry { t: number; d?: RepoData; e?: CachedError; }

  const cache = {
    key: (r: string) => `gh-card:${r.toLowerCase()}`,
    get(r: string): CacheEntry | null {
      try {
        const v = JSON.parse(localStorage.getItem(this.key(r)) ?? '');
        return v?.d || v?.e ? (v as CacheEntry) : null;
      } catch { return null; }
    },
    set(r: string, d: RepoData) {
      try { localStorage.setItem(this.key(r), JSON.stringify({ t: Date.now(), d } satisfies CacheEntry)); } catch {}
    },
    setError(r: string, e: CardError) {
      try { localStorage.setItem(this.key(r), JSON.stringify({ t: Date.now(), e: { kind: e.kind, status: e.status } } satisfies CacheEntry)); } catch {}
    },
    fresh(r: string): CacheEntry | null {
      const c = this.get(r);
      return c && Date.now() - c.t < 48 * 36e5 ? c : null;
    },
    stale(r: string): RepoData | null {
      return this.get(r)?.d ?? null;
    },
  };

  // ── 请求 ──────────────────────────────────────────────────────────

  async function fetchRepo(r: string): Promise<RepoData> {
    let res: Response;
    try {
      res = await globalThis.fetch(`${API}/${r}`);
    } catch {
      const e = new Error('Network error') as CardError;
      e.kind = 'network';
      throw e;
    }
    if (!res.ok) {
      const e = new Error(`HTTP ${res.status}`) as CardError;
      e.status = res.status;
      e.kind =
        res.status === 404
          ? 'notfound'
          : res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0'
            ? 'ratelimit'
            : 'http';
      throw e;
    }
    const raw = await res.json();
    const spdx: string | null = raw.license?.spdx_id ?? null;
    return {
      full_name: raw.full_name,
      description: raw.description,
      html_url: raw.html_url,
      stargazers_count: raw.stargazers_count ?? 0,
      forks_count: raw.forks_count ?? 0,
      open_issues_count: raw.open_issues_count ?? 0,
      license: spdx && spdx !== 'NOASSERTION' ? spdx : null,
      language: raw.language,
      updated_at: raw.updated_at,
      owner: { avatar_url: raw.owner?.avatar_url ?? '' },
    };
  }

  // ── 工具 ──────────────────────────────────────────────────────────

  function timeAgo(s: string): string {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 6e4);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    const mo = Math.floor(d / 30);
    return mo < 12 ? `${mo}mo ago` : `${Math.floor(d / 365)}y ago`;
  }

  function formatNum(n: number): string {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
  }

  // ── 状态操作 ──────────────────────────────────────────────────────

  async function load() {
    if (!repo || phase !== 'idle') return;
    phase = 'loading';

    const fresh = cache.fresh(repo);
    if (fresh) {
      if (fresh.d) { data = fresh.d; phase = 'loaded'; return; }
      if (fresh.e) {
        const ce = fresh.e;
        const er = new Error(ERR_MSG[ce.kind]) as CardError;
        er.kind = ce.kind;
        er.status = ce.status;
        err = er;
        phase = 'error';
        return;
      }
    }

    const stale = cache.stale(repo);
    if (stale) {
      data = stale;
      phase = 'loaded';
      // SWR: 过期缓存先渲染，后台刷新
      if (Date.now() - lastRefresh > 60_000) {
        lastRefresh = Date.now();
        fetchRepo(repo).then((d) => { cache.set(repo, d); data = d; }).catch(() => {});
      }
      return;
    }

    try {
      data = await fetchRepo(repo);
      cache.set(repo, data);
      phase = 'loaded';
    } catch (e) {
      const ce = e as CardError;
      cache.setError(repo, ce);
      err = ce;
      phase = 'error';
    }
  }

  async function retry() {
    if (!repo) return;
    phase = 'loading';
    err = null;
    try {
      data = await fetchRepo(repo);
      cache.set(repo, data);
      phase = 'loaded';
    } catch (e) {
      const ce = e as CardError;
      cache.setError(repo, ce);
      err = ce;
      phase = 'error';
    }
  }

  async function doRefresh() {
    if (!repo || spinning) return;
    spinning = true;
    try {
      data = await fetchRepo(repo);
      cache.set(repo, data);
      phase = 'loaded';
      err = null;
    } catch (e) {
      const ce = e as CardError;
      cache.setError(repo, ce);
      err = ce;
      phase = 'error';
    } finally {
      spinning = false;
    }
  }

  // ── 懒加载 ────────────────────────────────────────────────────────

  $effect(() => {
    if (!el) return;
    // shadow:'none' 时 Svelte mount 到宿主 light DOM 且不清空已有子节点，
    // 需手动移除 remark 注入的无 JS 回退占位，避免双份渲染
    for (const node of [...(el.parentElement?.childNodes ?? [])]) {
      if (node !== el) node.remove();
    }
  });

  $effect(() => {
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { obs.unobserve(entry.target); load(); }
      }
    }, { rootMargin: '200px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  });
</script>

<div class="gh-wrap" bind:this={el}>
  {#if phase === 'idle'}
    <a class="placeholder" href="https://github.com/{repo}" target="_blank" rel="noopener noreferrer">
      <GithubIcon class="icon" />
      <span class="name">{repo}</span>
      <span class="meta">N/A</span>
    </a>

  {:else if phase === 'loading'}
    <div class="loading">
      <span class="name">{repo}</span>
      <div class="spinner"></div>
    </div>

  {:else if phase === 'loaded' && data}
    <div class="loaded">
      <a class="body" href={data.html_url} target="_blank" rel="noopener noreferrer">
        <div class="head">
          <div class="head-left">
            {#if data.owner.avatar_url}
              <img
                class="avatar"
                src={data.owner.avatar_url}
                alt="" width="20" height="20" loading="lazy"
                onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            {/if}
            <span class="name">{data.full_name}</span>
          </div>
          <GithubIcon class="icon" />
        </div>

        {#if data.description}
          <p class="desc">{data.description}</p>
        {/if}

        <div class="meta">
          {#if data.language && LANG_COLORS[data.language]}
            <span class="lang">
              <span class="lang-dot" style="background-color:{LANG_COLORS[data.language]}"></span>
              {data.language}
            </span>
          {/if}
          {#if data.stargazers_count > 0}
            <span class="stat"><StarIcon /> {formatNum(data.stargazers_count)}</span>
          {/if}
          {#if data.forks_count > 0}
            <span class="stat"><ForkIcon /> {formatNum(data.forks_count)}</span>
          {/if}
          {#if data.open_issues_count > 0}
            <span class="stat"><IssueIcon /> {formatNum(data.open_issues_count)}</span>
          {/if}
          {#if data.license}
            <span class="stat"><LicenseIcon /> {data.license}</span>
          {/if}
          <span class="updated">Updated {timeAgo(data.updated_at)}</span>
        </div>
      </a>

      <button
        class="refresh" class:spinning
        type="button" aria-label="Refresh"
        onclick={(e) => { e.stopPropagation(); doRefresh(); }}
      >
        <RefreshIcon />
      </button>
    </div>

  {:else if phase === 'error' && err}
    <div class="error" role="status">
      <div class="error-main" class:static={err.kind === 'notfound'}>
        <AlertIcon />
        <span class="name">{repo}</span>
        <span class="error-detail">
          <span class="error-text">{ERR_MSG[err.kind]}</span>
          {#if err.kind !== 'notfound'}
            <button class="retry" type="button" aria-label="Retry" onclick={(e) => { e.stopPropagation(); retry(); }}>
              <RefreshIcon />
            </button>
          {/if}
        </span>
      </div>
      <a class="error-link" href="https://github.com/{repo}" target="_blank" rel="noopener noreferrer">
        <ExternalLinkIcon />
      </a>
    </div>
  {/if}
</div>

<style>
  .gh-wrap {
    margin: 1rem 0;
    font-family: var(--font-sans);
  }

  :global(.icon) {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .name {
    font-family: var(--font-monospace);
    font-weight: bold;
    color: var(--primary);
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── 共用 glass 背景 ──────────────────────────────────────── */

  .placeholder,
  .loading,
  .loaded {
    background: color-mix(in oklch, var(--surface), transparent 22%);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  /* ── placeholder ──────────────────────────────────────────── */

  .placeholder {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    text-decoration: none;
    color: var(--text-muted);
    font-size: 0.9rem;
    box-shadow: 0 2px 8px var(--shadow);
    transition:
      border-color var(--expressive-default-effects),
      box-shadow var(--expressive-default-effects);
  }

  .placeholder:hover {
    border-color: var(--primary);
    color: var(--text);
  }

  .placeholder .name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .placeholder .meta {
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  /* ── loading ──────────────────────────────────────────────── */

  .loading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.25rem;
  }

  /* ── loaded ───────────────────────────────────────────────── */

  .loaded {
    display: block;
    position: relative;
    padding: 1rem 1.25rem;
    box-shadow: 0 2px 8px var(--shadow);
    transition:
      border-color var(--expressive-default-effects),
      box-shadow var(--expressive-default-effects);
  }

  .loaded:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 12px var(--shadow);
  }

  .loaded:active {
    transform: scale(0.995);
  }

  .body {
    display: block;
    color: var(--text);
    text-decoration: none;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .head > :global(svg) {
    transition: opacity var(--expressive-fast-effects);
  }

  .loaded:hover .head > :global(svg) {
    opacity: 0;
  }

  .head-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .avatar {
    width: 20px;
    height: 20px;
    max-width: none;
    min-width: 20px;
    min-height: 20px;
    margin: 0;
    border-radius: 50%;
    flex-shrink: 0;
    display: block;
  }

  .desc {
    margin: 0 0 0.75rem;
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.5;
    text-align: left;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .lang {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-monospace);
  }

  .lang-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .stat {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .stat :global(svg) {
    width: 14px;
    height: 14px;
  }

  .updated {
    margin-left: auto;
  }

  /* ── refresh 按钮 ─────────────────────────────────────────── */

  .refresh {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    opacity: 0;
    transform: translateY(-4px);
    transition:
      opacity var(--expressive-slow-effects),
      transform var(--expressive-slow-effects),
      color var(--expressive-fast-effects),
      border-color var(--expressive-fast-effects);
  }

  .refresh > :global(svg) {
    width: 16px;
    height: 16px;
  }

  .refresh:hover {
    color: var(--primary);
    border-color: var(--primary);
  }

  .refresh:active {
    transform: scale(0.94);
  }

  .refresh.spinning {
    opacity: 1;
    transform: scale(1);
  }

  .refresh.spinning > :global(svg) {
    animation: spin 0.8s linear infinite;
  }

  .loaded:hover .refresh,
  .refresh:focus-visible {
    opacity: 1;
    transform: scale(1);
  }

  @media (hover: none) {
    .refresh {
      opacity: 0.6;
      transform: none;
    }
  }

  /* ── error ────────────────────────────────────────────────── */

  .error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid var(--error);
    border-radius: 12px;
    background: var(--error-container);
    padding: 0.55rem 1rem;
    color: var(--on-error-container);
    font-size: 0.85rem;
  }

  .error-main {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  .error-main > :global(svg) {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .error-main .name {
    flex-shrink: 0;
  }

  .error-main.static {
    cursor: default;
  }

  .error-detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .error-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .retry {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-left: auto;
    width: 36px;
    height: 36px;
    border: 1px solid color-mix(in oklch, var(--on-error-container), transparent 35%);
    border-radius: 10px;
    background: color-mix(in oklch, var(--on-error-container), transparent 92%);
    padding: 0;
    color: inherit;
    cursor: pointer;
    transition:
      background-color var(--expressive-fast-effects),
      border-color var(--expressive-fast-effects),
      transform var(--expressive-fast-effects);
  }

  .retry > :global(svg) {
    width: 20px;
    height: 20px;
  }

  .retry:hover {
    background: color-mix(in oklch, var(--on-error-container), transparent 78%);
    border-color: var(--on-error-container);
  }

  .retry:active {
    transform: scale(0.96);
  }

  .error-link {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: inherit;
    opacity: 0.7;
    transition: opacity var(--expressive-fast-effects);
  }

  .error-link > :global(svg) {
    width: 18px;
    height: 18px;
  }

  .error-link:hover {
    opacity: 1;
  }

  /* ── 响应式 ───────────────────────────────────────────────── */

  @media (max-width: 640px) {
    .placeholder,
    .loading,
    .loaded,
    .error {
      padding: 0.6rem 1rem;
    }

    .name {
      font-size: 0.85rem;
    }

    .desc {
      font-size: 0.8rem;
      line-clamp: 1;
      -webkit-line-clamp: 1;
    }

    .meta {
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .updated {
      margin-left: 0;
      width: 100%;
      margin-top: 0.25rem;
    }

    .error-main {
      flex-wrap: wrap;
      row-gap: 0.4rem;
    }

    .error-detail {
      flex-basis: 100%;
    }
  }
</style>
