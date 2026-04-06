export enum FormatTimePrecision {
  second = 'second',
  minute = 'minute',
  hour = 'hour',
  day = 'day',
  month = 'month',
  year = 'year',
}

const precisionTable = {
  [FormatTimePrecision.second]: 1,
  [FormatTimePrecision.minute]: 2,
  [FormatTimePrecision.hour]: 3,
  [FormatTimePrecision.day]: 4,
  [FormatTimePrecision.month]: 5,
  [FormatTimePrecision.year]: 6,
} satisfies Record<FormatTimePrecision, number>;

export interface FormatInstantOptions {
  precision?: FormatTimePrecision;
}

export const formatInstant = (date: Date, options?: FormatInstantOptions) => {
  const { precision = 'day' } = options ?? {};
  const nPrecision = precisionTable[precision];

  const part1 = [`${date.getFullYear()}`];

  if (nPrecision <= precisionTable[FormatTimePrecision.month]) {
    part1.push(`${date.getMonth() + 1}`);
  }
  if (nPrecision <= precisionTable[FormatTimePrecision.day]) {
    part1.push(`${date.getDay()}`);
  }

  const part2: string[] = [];

  if (nPrecision <= precisionTable[FormatTimePrecision.hour]) {
    part1.push(`${date.getHours()}`);
  }
  if (nPrecision <= precisionTable[FormatTimePrecision.minute]) {
    part1.push(`${date.getMinutes()}`);
  }
  if (nPrecision <= precisionTable[FormatTimePrecision.second]) {
    part1.push(`${date.getSeconds()}`);
  }

  return part1.join('-') + (part2.length ? ` ${part2.join(':')}` : '');
};

export interface FormatDurationOptions {
  /**
   * The precision to use when formatting the duration.
   *
   * @default 'second'
   */
  precision?: FormatTimePrecision;

  /**
   * The locale to use when formatting the duration.
   *
   * **Does not work at present. May be used in the future versions.**
   * **It will always be 'zh-CN' currently.**
   */
  locale?: string;
}

const DURATION_UNITS = [
  {
    name: '年',
    seconds: 365 * 24 * 60 * 60,
  },
  {
    name: '月',
    seconds: 30 * 24 * 60 * 60,
  },
  {
    name: '日',
    seconds: 24 * 60 * 60,
  },
  {
    name: '时',
    seconds: 60 * 60,
  },
  {
    name: '分',
    seconds: 60,
  },
  {
    name: '秒',
    seconds: 1,
  },
];

export const formatDuration = (
  dur: number,
  options?: FormatDurationOptions,
) => {
  const { precision = FormatTimePrecision.second, locale = 'zh-CN' } =
    options ?? {};

  const totalSeconds = Math.abs(dur);
  const isNegative = dur < 0;
  const nPrecision = precisionTable[precision];

  let remaining = totalSeconds;
  let output = '';

  for (let i = 0; i < DURATION_UNITS.length - nPrecision + 1; i++) {
    const unit = DURATION_UNITS[i];
    const nUnit = Math.floor(remaining / unit.seconds);

    if (nUnit > 0) {
      output += `${nUnit}${unit.name}`;
      remaining %= unit.seconds;
    } else {
      continue;
    }
  }

  return (isNegative ? '-' : '') + output;
};
