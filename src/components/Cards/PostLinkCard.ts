import { Switcher, apply } from '../../utils/other';
import stylus from 'stylus';
import { layout } from '../../config';

const {
  hoverScale,
  slideLayerInitialWidth,
  slideLayerStyle,
  slideLayerPosition,
  slideLayerOffset,
  slideLayerClickOffset,
} = layout.component.PostLinkCard;

const wrapperHoverTransformRules: string[] = [];
const wrapperTransitionProperties: Set<string> = new Set();

const leftneg = slideLayerPosition === 'left' ? '-' : '';
const rightneg = slideLayerPosition === 'right' ? '-' : '';
const swslStyle = new Switcher(slideLayerStyle, '');
const slideLayerStylus =
  slideLayerStyle !== 'none'
    ? `
  .card.link-card {
    background-color: transparent;
    padding: 0;
    align-items: ${slideLayerPosition === 'left' ? 'flex-start' : 'flex-end'};

    &:hover {
      &::before { 
        ${swslStyle.on('popout', `transform: translateX(${leftneg}${slideLayerOffset});`)}
      }

      &>.wrapper {
        ${swslStyle.on(
          'squeeze',
          `margin-${slideLayerPosition}: ${slideLayerOffset};`,
        )}
      }
    }

    &:active {
      &::before {
        ${swslStyle.on('popout', `transform: translateX(${leftneg}${slideLayerClickOffset});`)}
      }

      &>.wrapper {
        ${swslStyle.onMap({
          squeeze: `margin-${slideLayerPosition}: ${slideLayerClickOffset};`,
          uncover: `transform: translateX(${rightneg}${slideLayerClickOffset});`,
        })}
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
    }
  }
`
    : '';
if (slideLayerStyle === 'uncover') {
  wrapperHoverTransformRules.push(
    `translateX(${rightneg}${slideLayerOffset})`,
  );
  wrapperTransitionProperties.add('transform');
} else if (slideLayerStyle === 'squeeze') {
  wrapperTransitionProperties.add(`margin-${slideLayerPosition}`);
}

if (typeof hoverScale === 'number') {
  wrapperHoverTransformRules.push(`scale(${hoverScale})`);
  wrapperTransitionProperties.add('transform');
}

const mergedRulesCss = `
  .card.link-card { 
    &:hover:not(:active) {
      &>.wrapper {
        ${apply(wrapperHoverTransformRules.join(' '), (rules) => (rules ? `transform: ${rules};` : ''))}
      }
    }

    &>.wrapper {
      ${
        wrapperTransitionProperties
          ? apply(
              wrapperTransitionProperties
                .keys()
                .map((prop) => `${prop} var(--expressive-default-effects)`)
                .toArray()
                .join(','),
              (props) => `transition: ${props};`,
            )
          : ''
      }
    }
  }
`;

export default stylus.render([slideLayerStylus, mergedRulesCss].join('\n'));
