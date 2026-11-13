/**
 * 把 t.raw() 取出的原始文案里的 {name} 占位符换成值（不走 ICU）。
 * 带价格的文案交给客户端组件 PricedFill 按访客币种渲染，服务端用同一个函数填 USD：
 * 搜索引擎和 JSON-LD 看到的是静态 HTML 里的 USD 价格，访客看到的是自己币种的价格。
 * 没有对应值的占位符原样保留。
 */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}
