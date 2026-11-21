import { FeatureCta, useFeatureCtaCopy } from "@/components/FeatureCta";
import type { ToolType } from "@/lib/blogTools";

/**
 * 内容页（对比 / 季型 / 名人 / 脸型 / 指南 / 博客）里的「看到成品 → 我也想要」入口。
 * 样式和话术和功能页是同一个组件（FeatureCta）：左边是这个工具真实生成的示例报告，
 * 右边一句「上传自拍 → 得到什么」（messages 的 blog.cta.<type>）+ 结果型按钮 + 先看示例。
 *
 * 以前不传 copy 时是另一套老样式：类型标签 + 「这份结果也可以是你的」+ tryPage.out_<type> 说明行 + 通用的 Start Free Analysis，
 * 其中 out_color_analysis 写的是杂志级整份报告，和「免费只给打码预览」对不上，也和博客里同一个入口话术不一致，所以统一下线。
 *
 * - copy：博客用它覆盖标题 / 按钮（和 blog.cta.<type> 取值相同，保留为兼容入参）
 * - season：页面讲哪个季型，示例就挑同一色彩家族的示例人物
 * - variant：card = 带缩略图的卡片（页面中段 / 首屏下方）；band = 页面底部的收尾条
 */
export function ResultCta({
  type,
  from,
  copy,
  season,
  variant = "card",
  className = "",
}: {
  type: ToolType;
  /** 来源页面类型，只用于统计 */
  from: string;
  copy?: { title: string; button: string };
  season?: string | null;
  variant?: "card" | "band";
  className?: string;
}) {
  const base = useFeatureCtaCopy(type);
  return (
    <FeatureCta
      tool={type}
      from={from}
      season={season}
      variant={variant}
      className={className}
      copy={copy ? { ...base, title: copy.title, button: copy.button } : base}
    />
  );
}
