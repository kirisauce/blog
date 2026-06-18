/**
 * 将 `{key1="val1" key2="val2"}` 花括号属性块中的内容
 * 解析为键值对对象。
 *
 * 支持的格式：
 *   key="value"     - 双引号值
 *   key='value'     - 单引号值
 *   key="a b c"     - 含空格的值
 *   data-key="val"  - 连字符属性名
 *
 * @param attrString 花括号内部字符串，可为空
 * @returns 属性键值对映射
 */
export function parseAttrs(attrString: string): Record<string, string> {
  if (!attrString || attrString.trim().length === 0) {
    return {};
  }

  const attrs: Record<string, string> = {};
  const attrRegex =
    /(\w+(?:-\w+)*)\s*=\s*"([^"]*)"|(\w+(?:-\w+)*)\s*=\s*'([^']*)'/g;

  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attrString)) !== null) {
    const key = match[1] ?? match[3];
    const value = match[2] ?? match[4];
    attrs[key] = value;
  }

  return attrs;
}
