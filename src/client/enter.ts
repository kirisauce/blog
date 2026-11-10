import { m3anim } from '../utils/consts';

/** 相邻元素的入场间隔（毫秒） */
const STAGGER = 60;

/** 入场起始位移（像素） */
const DISTANCE = 30;

const ITEM_SELECTOR = '[data-enter-item]';

const root = document.documentElement;

/**
 * 播放首屏元素入场。只有完整加载时 <html> 才带 pending 标记，
 * 站内换页（视图过渡接管）与重复调用都会直接返回。
 */
const play = () => {
  if (root.dataset.enter !== 'pending') {
    return;
  }
  root.dataset.enter = 'done';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const { duration, easing } = m3anim.expressiveDefaultSpatial;
  document.querySelectorAll<HTMLElement>(ITEM_SELECTOR).forEach((el, index) => {
    el.animate(
      [
        { opacity: 0, transform: `translateY(${DISTANCE}px)` },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration,
        easing,
        delay: index * STAGGER,
        fill: 'backwards',
      },
    );
  });
};

play();
document.addEventListener('astro:page-load', play);
