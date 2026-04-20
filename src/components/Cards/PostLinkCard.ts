import { Switcher, apply } from '../../utils/other';
import stylus from 'stylus';
import { layout } from '../../config';

const {
  hoverScale,
  slideLayerInitialWidth,
  slideLayerStyle,
  slideLayerPosition,
  slideLayerOffset,
} = layout.component.PostLinkCard;

const wrapperHoverTransformRules: string[] = [];

const swslStyle = new Switcher(slideLayerStyle, '');
const slideLayerStylus =
  slideLayerStyle !== 'none'
    ? `
  .card.link-card {
    background-color: transparent;
    padding: 0;
    align-items: ${slideLayerPosition === 'left' ? 'flex-start' : 'flex-end'};

    &:hover {
      ${swslStyle.on(
        'popout',
        `&::before { transform: translateX(${
          slideLayerPosition === 'left' ? '-' : ''
        }${slideLayerOffset}); }`,
      )}

      >.wrapper {
        ${swslStyle.on(
          'squeeze',
          `margin-${slideLayerPosition}: ${slideLayerOffset};`,
        )}
      }
    }

    &::before {
      content: '${slideLayerPosition === 'left' ? '<' : '>'}';
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
      background-color: var(--secondary);
      border-radius: 16px;
      z-index: -10;
      opacity: 0.75;
      font-weight: 800;
      font-size: 20px;

      display: flex;
      flex-direction: ${slideLayerPosition === 'left' ? 'row' : 'row-reverse'};
      align-items: center;
      padding-${slideLayerPosition}: 8px;
      font-family: var(--font-monospace);
      color: var(--text);

      ${swslStyle.on(
        'popout',
        'transition: transform var(--expressive-default-effects);',
      )}
    }

    &>.wrapper {
      position: relative;
      padding: 24px;
      margin-${slideLayerPosition}: ${slideLayerInitialWidth};
      background-color: var(--secondary-container);
      border-radius: 14px;

      ${apply(
        swslStyle.onMap({
          uncover: 'transform',
          squeeze: `margin-${slideLayerPosition}`,
        }),
        (name) =>
          name ? `transition: ${name} var(--expressive-default-effects);` : '',
      )}
    }
  }
`
    : '';
if (slideLayerStyle === 'uncover') {
  wrapperHoverTransformRules.push(
    `translateX(${
      slideLayerPosition === 'left' ? '' : '-'
    }${slideLayerOffset})`,
  );
}

const hoverEffectsStylus = `
  .card.link-card {
    ${
      typeof hoverScale === 'number'
        ? `
        &>.wrapper {
          ${
            swslStyle.on('uncover', ' ') ||
            'transition: transform var(--expressive-default-effects);'
          }
        }`
        : ''
    }
  }
`;
if (typeof hoverScale === 'number') {
  wrapperHoverTransformRules.push(`scale(${hoverScale})`);
}

const mergedRulesCss = `
  .card.link-card { 
    &:hover {
      &>.wrapper {
        ${apply(wrapperHoverTransformRules.join(' '), (rules) => (rules ? `transform: ${rules};` : ''))}
      }
    }
  }
`;

export default stylus.render(
  [slideLayerStylus, hoverEffectsStylus, mergedRulesCss].join('\n'),
);
