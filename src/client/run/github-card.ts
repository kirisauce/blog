/**
 * GitHub 仓库卡片 — 客户端懒加载脚本。
 *
 * Markdown 中通过 ::github[owner/repo] 语法注入的占位元素由
 * remark 插件生成，此脚本在元素进入视口时将其升级为完整卡片。
 *
 * 状态流转（均在 remark 生成的 .gh-card 容器内部切换，容器本身不替换）：
 *   1. 占位（.gh-card--placeholder）— 脚本未运行 / 请求失败回退
 *   2. 加载中（.gh-card--loading + spinner）
 *   3. 完整卡片（.gh-card--loaded）
 *
 * 缓存：localStorage key `gh-card:{repo小写}`，TTL 48h；
 * 过期缓存先渲染旧数据再后台静默刷新（stale-while-revalidate）。
 *
 * 此脚本通过 HeadBase.astro 以 ?inline 方式内联到 <head>，
 * 通过 astro:page-load 事件触发初始化（兼容 View Transitions）。
 */

const GH_API_BASE = 'https://api.github.com/repos';

// ── 语言颜色映射表（GitHub linguist 常用颜色） ──────────────────────
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

// ── 缓存（localStorage，TTL 48h） ──────────────────────────────────

const CACHE_PREFIX = 'gh-card:';
const CACHE_TTL_MS = 48 * 60 * 60 * 1000;
// SWR 后台刷新失败后的内存级退避，避免限流场景反复打失败请求
const SWR_BACKOFF_MS = 60_000;

interface RepoData {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  license: { spdx_id: string } | null;
  updated_at: string;
  owner: {
    avatar_url: string;
  };
}

interface CacheEntry {
  t: number; // fetchedAt
  d: RepoData;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readCache(repo: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + repo.toLowerCase());
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.t !== 'number' || !entry.d?.full_name) return null;
    return entry as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(repo: string, data: RepoData): void {
  try {
    const entry: CacheEntry = { t: Date.now(), d: data };
    localStorage.setItem(
      CACHE_PREFIX + repo.toLowerCase(),
      JSON.stringify(entry),
    );
  } catch {
    // 存储不可用（隐私模式 / 容量满）→ 静默降级为无缓存直连
  }
}

/** 只提取渲染所需字段，控制缓存体积 */
function pickData(raw: any): RepoData {
  const fullName = String(raw.full_name ?? '');
  return {
    full_name: fullName,
    description: raw.description == null ? null : String(raw.description),
    html_url: String(raw.html_url ?? `https://github.com/${fullName}`),
    stargazers_count: Number(raw.stargazers_count ?? 0),
    forks_count: Number(raw.forks_count ?? 0),
    open_issues_count: Number(raw.open_issues_count ?? 0),
    language: raw.language == null ? null : String(raw.language),
    license: raw.license ? { spdx_id: String(raw.license.spdx_id ?? '') } : null,
    updated_at: String(raw.updated_at ?? ''),
    owner: { avatar_url: String(raw.owner?.avatar_url ?? '') },
  };
}

// ── 请求（同页同 repo 共享 in-flight promise） ──────────────────────

const inflight = new Map<string, Promise<RepoData>>();
const swrFailedAt = new Map<string, number>();

function fetchRepo(repo: string): Promise<RepoData> {
  const existing = inflight.get(repo);
  if (existing) return existing;

  const p = fetch(`${GH_API_BASE}/${repo}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as any;
    })
    .then(pickData);

  inflight.set(repo, p);
  const settle = () => inflight.delete(repo);
  p.then(settle, settle);
  return p;
}

// ── 辅助函数 ──────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function formatCount(n: number): string {
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return n.toString();
}

// ── 卡片构建 ───────────────────────────────────────────────────────

function buildCardInner(data: RepoData): string {
  const langDot =
    data.language && LANG_COLORS[data.language]
      ? `<span class="gh-card__lang-dot" style="background-color:${LANG_COLORS[data.language]}"></span>`
      : '';

  const lang = data.language
    ? `<span class="gh-card__lang">${langDot}${escapeHtml(data.language)}</span>`
    : '';

  const icons = window.__CONFIG__?.icons;
  const stars =
    data.stargazers_count > 0
      ? `<span class="gh-card__stars">${icons?.star ?? '★'} ${formatCount(data.stargazers_count)}</span>`
      : '';

  const forks =
    data.forks_count > 0
      ? `<span class="gh-card__forks">${icons?.fork ?? '⑂'} ${formatCount(data.forks_count)}</span>`
      : '';

  const name = escapeHtml(data.full_name);
  const desc = data.description ? escapeHtml(data.description) : '';
  const avatar = escapeHtml(data.owner.avatar_url);
  const avatarImg = avatar
    ? `<img class="gh-card__avatar" src="${avatar}" alt="" width="20" height="20" loading="lazy" onerror="this.style.display='none'">`
    : '';

  return (
    `<div class="gh-card__header"><div class="gh-card__header-left">${avatarImg}<span class="gh-card__name">${name}</span></div>${icons?.github ?? ''}</div>` +
    (desc ? `<p class="gh-card__desc">${desc}</p>` : '') +
    `<div class="gh-card__meta">${lang}${stars}${forks}<span class="gh-card__updated">Updated ${timeAgo(data.updated_at)}</span></div>`
  );
}

// ── 状态渲染（写入 .gh-card 容器内部） ─────────────────────────────

function renderLoading(el: HTMLElement, repo: string): void {
  el.innerHTML =
    `<div class="gh-card--loading"><span class="gh-card__name">${escapeHtml(repo)}</span><div class="gh-card__spinner"></div></div>`;
}

function renderLoaded(el: HTMLElement, data: RepoData): void {
  el.innerHTML =
    `<div class="gh-card--loaded">` +
    `<a class="gh-card__main" href="${escapeHtml(data.html_url)}" target="_blank" rel="noopener noreferrer">${buildCardInner(data)}</a>` +
    `</div>`;
}

// ── 加载决策 ───────────────────────────────────────────────────────

function swrRefresh(el: HTMLElement, repo: string): void {
  if (Date.now() - (swrFailedAt.get(repo) ?? 0) < SWR_BACKOFF_MS) return;

  fetchRepo(repo).then(
    (data) => {
      writeCache(repo, data);
      if (el.isConnected) renderLoaded(el, data);
    },
    () => {
      swrFailedAt.set(repo, Date.now()); // 保持旧数据渲染结果不动
    },
  );
}

function loadCard(el: HTMLElement): void {
  const repo = el.dataset.repo?.trim();
  // ghState 防御重复触发（重复 init / 多 observer 竞争同一元素）
  if (!repo || el.dataset.ghState) return;
  el.dataset.ghState = 'pending';

  const cached = readCache(repo);

  // 新鲜缓存 → 直接渲染，零网络请求
  if (cached && Date.now() - cached.t < CACHE_TTL_MS) {
    renderLoaded(el, cached.d);
    el.dataset.ghState = 'loaded';
    return;
  }

  // 过期缓存 → 先渲染旧数据，后台静默刷新
  if (cached) {
    renderLoaded(el, cached.d);
    swrRefresh(el, repo);
    el.dataset.ghState = 'loaded';
    return;
  }

  // 无缓存 → loading → 请求；失败回退占位链接
  const fallbackHTML = el.innerHTML;
  renderLoading(el, repo);
  fetchRepo(repo).then(
    (data) => {
      writeCache(repo, data);
      renderLoaded(el, data);
      el.dataset.ghState = 'loaded';
    },
    () => {
      el.innerHTML = fallbackHTML;
      el.dataset.ghState = 'error';
    },
  );
}

// ── 懒加载初始化 ───────────────────────────────────────────────────

function initGithubCards() {
  const cards = document.querySelectorAll<HTMLElement>('.gh-card');
  if (cards.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        loadCard(entry.target as HTMLElement);
      }
    },
    {
      rootMargin: '200px 0px',
      threshold: 0,
    },
  );

  cards.forEach((el) => observer.observe(el));
}

// ── 注册事件 ───────────────────────────────────────────────────────

document.addEventListener('astro:page-load', initGithubCards);
