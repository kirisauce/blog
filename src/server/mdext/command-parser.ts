/**
 * 通用的 `::命令[参数]{属性}` 语法解析器。
 *
 * 负责从 Markdown 文本中识别出所有 `::cmd[arg]{attrs}` 模式的匹配，
 * 返回结构化的匹配信息供各命令插件消费。
 *
 * 匹配模式：
 *   ::命令名[参数]{key1="val1" key2="val2"}
 *
 * 分组：
 *   1 → 命令名（如 i, img, bq）
 *   2 → 方括号内的参数
 *   3 → 可选的花括号属性块
 */

const COMMAND_RE = /::(\w+)\[([^\]]+)\](?:\{([^}]*)\})?/g;

export interface CommandMatch {
  /** 完整匹配文本（如 `::i[mdi:calendar]{class="icon"}`） */
  fullMatch: string;
  /** 命令名（如 'i'） */
  cmd: string;
  /** 方括号内的参数（如 'mdi:calendar'） */
  arg: string;
  /** 花括号内的属性字符串（如 `class="icon" style="color:red"`） */
  attrsString: string;
  /** 匹配在原文本中的起始位置 */
  startIndex: number;
  /** 匹配在原文本中的结束位置 */
  endIndex: number;
}

/**
 * 扫描文本，提取所有 `::命令[参数]{属性}` 匹配。
 *
 * @param text 原始 Markdown 文本
 * @returns 所有匹配结果（未必都是当前关心的命令，由消费方自行过滤）
 */
export function parseCommands(text: string): CommandMatch[] {
  if (!text.includes('::')) return [];

  const matches: CommandMatch[] = [];
  COMMAND_RE.lastIndex = 0;

  let cmdMatch: RegExpExecArray | null;
  while ((cmdMatch = COMMAND_RE.exec(text)) !== null) {
    matches.push({
      fullMatch: cmdMatch[0],
      cmd: cmdMatch[1],
      arg: cmdMatch[2],
      attrsString: cmdMatch[3] ?? '',
      startIndex: cmdMatch.index,
      endIndex: cmdMatch.index + cmdMatch[0].length,
    });
  }

  return matches;
}
