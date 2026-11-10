<script lang="ts">
  import IconArrowUp from '~icons/mingcute/arrow-up-line';

  interface Props {
    /** 滚动容器选择器 */
    scrollContainer?: string;
    /** 滚动超过多少倍容器视口高度后出现 */
    threshold?: number;
  }

  const { scrollContainer = '#page', threshold = 1 }: Props = $props();

  // 进度环几何：viewBox 0 0 64 64，半径按线宽留出边距
  const RING_RADIUS = 29.5;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  let visible = $state(false);
  let progress = $state(0);
  let btn: HTMLButtonElement | undefined;

  const dashOffset = $derived(RING_CIRCUMFERENCE * (1 - progress));

  $effect(() => {
    const container = document.querySelector<HTMLElement>(scrollContainer);
    if (!container) return;

    const limit = container.clientHeight * threshold;
    const onScroll = () => {
      const next = container.scrollTop > limit;

      // 按钮即将隐藏而仍持有焦点时，先把焦点交还滚动容器，以免焦点掉落 body
      if (!next && document.activeElement === btn) {
        container.focus({ preventScroll: true });
      }

      visible = next;

      const max = container.scrollHeight - container.clientHeight;
      progress = max > 0 ? container.scrollTop / max : 0;
    };

    onScroll();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  });

  function scrollToTop() {
    document.querySelector<HTMLElement>(scrollContainer)?.scrollTo({
      top: 0,
      // 尊重系统的减少动态效果设置
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }
</script>

<div class="back-to-top" class:visible>
  <svg class="ring" viewBox="0 0 64 64" aria-hidden="true">
    <circle class="ring-track" cx="32" cy="32" r={RING_RADIUS} />
    <circle
      class="ring-value"
      cx="32"
      cy="32"
      r={RING_RADIUS}
      stroke-dasharray={RING_CIRCUMFERENCE}
      stroke-dashoffset={dashOffset}
    />
  </svg>

  <button
    id="back-to-top"
    class="btn"
    type="button"
    aria-label="返回顶部"
    title="返回顶部"
    inert={!visible}
    onclick={scrollToTop}
    bind:this={btn}
  >
    <IconArrowUp />
  </button>
</div>

<style lang="stylus">
  // 显隐共用的常驻过渡
  motion = opacity var(--expressive-fast-effects), translate var(--expressive-fast-spatial), scale var(--expressive-fast-spatial)

  .back-to-top {
    position: fixed;
    right: 24px;
    bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    // 高于正文（10）与页脚，低于导航栏（500）
    z-index: 400;

    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;

    // 离场：缩小 + 下沉 + 淡出，visibility 等过渡走完再切
    opacity: 0;
    visibility: hidden;
    translate: 0 12px;
    scale: 0.8;
    pointer-events: none;
    transition:
      motion,
      visibility 0s linear var(--expressive-fast-spatial-duration);

    &.visible {
      opacity: 1;
      visibility: visible;
      translate: 0 0;
      scale: 1;
      pointer-events: auto;
      transition:
        motion,
        visibility 0s;
    }

    &:hover {
      scale: 1.08;

      .btn {
        background-color: var(--primary-container);
        box-shadow:
          0 16px 40px -8px var(--shadow),
          0 2px 6px -2px var(--shadow);
      }
    }

    &:active {
      scale: 0.94;
    }

    @media (max-width: 640px) {
      right: 16px;
      bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      width: 56px;
      height: 56px;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    // 让填充从 12 点方向顺时针开始
    transform: rotate(-90deg);
    pointer-events: none;

    circle {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
    }
  }

  .ring-track {
    stroke: var(--border-60);
  }

  .ring-value {
    stroke: var(--primary);
  }

  .btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 0;
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: 50%;
    background-color: var(--primary-container-72);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow:
      0 12px 32px -8px var(--shadow),
      0 2px 6px -2px var(--shadow);
    color: var(--secondary);
    cursor: pointer;
    transition:
      background-color var(--expressive-default-effects),
      box-shadow var(--expressive-default-effects);

    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    :global(svg) {
      width: 22px;
      height: 22px;
    }

    @media (max-width: 640px) {
      width: 44px;
      height: 44px;
    }
  }
</style>
