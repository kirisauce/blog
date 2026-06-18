/**
 * GitHub 仓库卡片 — 客户端懒加载脚本。
 *
 * Markdown 中通过 ::github[owner/repo] 语法注入的占位元素由
 * remark 插件生成，此脚本在元素进入视口时将其升级为完整卡片。
 *
 * 三种状态：
 *   1. 占位（remark 生成的 .gh-card--placeholder）— 脚本未运行 / 失败回退
 *   2. 加载中（.gh-card--loading + spinner）          — 数据请求中
 *   3. 完整卡片（.gh-card--loaded）                   — 数据填充完毕
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

// ── GitHub API 响应类型 ────────────────────────────────────────────

interface RepoData {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  owner: {
    avatar_url: string;
  };
}

// ── 卡片构建 ───────────────────────────────────────────────────────

function buildCard(data: RepoData): string {
  const langDot =
    data.language && LANG_COLORS[data.language]
      ? `<span class="gh-card__lang-dot" style="background-color:${LANG_COLORS[data.language]}"></span>`
      : '';

  const lang = data.language
    ? `<span class="gh-card__lang">${langDot}${data.language}</span>`
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

  const name = data.full_name;
  const desc = data.description ?? '';
  const avatar = data.owner.avatar_url;
  const avatarImg = avatar
    ? `<img class="gh-card__avatar" src="${avatar}" alt="" width="20" height="20" loading="lazy" onerror="this.style.display='none'">`
    : '';

  return (
    `<a class="gh-card--loaded" href="${data.html_url}" target="_blank" rel="noopener noreferrer">` +
    `<div class="gh-card__header"><div class="gh-card__header-left">${avatarImg}<span class="gh-card__name">${name}</span></div>${icons?.github ?? ''}</div>` +
    (desc ? `<p class="gh-card__desc">${desc}</p>` : '') +
    `<div class="gh-card__meta">${lang}${stars}${forks}<span class="gh-card__updated">Updated ${timeAgo(data.updated_at)}</span></div>` +
    `</a>`
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

        const el = entry.target as HTMLElement;
        const repo = el.dataset.repo;
        if (!repo) {
          observer.unobserve(el);
          continue;
        }

        // 防止重复请求
        observer.unobserve(el);

        // 保存占位 HTML，用于加载失败时回退
        const fallbackHTML = el.innerHTML;

        // 切换到 loading 状态（仍然显示仓库名称 + spinner）
        el.innerHTML = `<div class="gh-card--loading"><span class="gh-card__name">${repo}</span><div class="gh-card__spinner"></div></div>`;

        fetch(`${GH_API_BASE}/${repo}`)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json() as Promise<RepoData>;
          })
          .then((data) => {
            const temp = document.createElement('div');
            temp.innerHTML = buildCard(data);
            const card = temp.firstElementChild!;
            el.replaceWith(card);
          })
          .catch(() => {
            // 恢复占位内容
            el.innerHTML = fallbackHTML;
          });
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
