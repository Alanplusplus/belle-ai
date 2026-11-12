#!/usr/bin/env node
/**
 * 把线上 sitemap 里的地址推送给 IndexNow（Bing / Yandex / Naver / Seznam 等共享），让新页面和改动页面更快被收录。
 * Bing 的索引同时供给 Copilot、ChatGPT 搜索、DuckDuckGo、Ecosia、Yahoo，所以对 GEO 也有帮助。Google 不参与 IndexNow。
 *
 * 用法（部署完成、新版本已经在线之后再跑）：
 *   npm run indexnow                  # 推送 sitemap 里 lastmod 在最近 3 天内的地址
 *   npm run indexnow -- --since 14    # 最近 14 天
 *   npm run indexnow -- --all         # 全量（首次启用时跑一次）
 *   npm run indexnow -- --dry-run     # 只列出会推送多少条，不发请求
 *
 * 密钥是公开的：按协议必须放在站点根目录（public/<KEY>.txt，内容就是 KEY 本身），搜索引擎用它校验你拥有这个域名。
 * 改密钥时，脚本里的 KEY 和 public 下的文件名/内容要一起改。
 */

const KEY = "089ecfdf5b89084864a92b719e321405";
const SITE = (process.env.SITE_URL || "https://www.aicoloranalysis.io").replace(/\/$/, "");
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH = 5000; // 协议上限是 10000 条/次

const args = process.argv.slice(2);
const all = args.includes("--all");
const dryRun = args.includes("--dry-run");
const sinceIdx = args.indexOf("--since");
const sinceDays = sinceIdx >= 0 ? Number(args[sinceIdx + 1]) : 3;
if (!all && !(sinceDays > 0)) {
  console.error("--since 需要一个正数（天）");
  process.exit(1);
}

const host = new URL(SITE).host;
const keyLocation = `${SITE}/${KEY}.txt`;

// 先确认密钥文件已经上线，否则搜索引擎会直接拒收（403），白跑一趟
const keyRes = await fetch(keyLocation);
const keyBody = keyRes.ok ? (await keyRes.text()).trim() : "";
if (keyBody !== KEY) {
  console.error(`密钥文件还没上线或内容不对：${keyLocation}（HTTP ${keyRes.status}）。请先部署再推送。`);
  process.exit(1);
}

const sitemapRes = await fetch(`${SITE}/sitemap.xml`);
if (!sitemapRes.ok) {
  console.error(`读取 sitemap 失败：HTTP ${sitemapRes.status}`);
  process.exit(1);
}
const xml = await sitemapRes.text();
const cutoff = Date.now() - sinceDays * 24 * 3600 * 1000;

const urls = [];
for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
  const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
  if (!loc) continue;
  const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
  if (!all && (!lastmod || new Date(lastmod).getTime() < cutoff)) continue;
  urls.push(loc.replace(/&amp;/g, "&"));
}

console.log(`${all ? "全量" : `最近 ${sinceDays} 天有更新`}：${urls.length} 条地址${dryRun ? "（dry-run，不发送）" : ""}`);
if (dryRun || urls.length === 0) process.exit(0);

for (let i = 0; i < urls.length; i += BATCH) {
  const batch = urls.slice(i, i + BATCH);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation, urlList: batch }),
  });
  // 200 已接收；202 已接收但密钥校验排队中；其余都是失败
  console.log(`第 ${i / BATCH + 1} 批 ${batch.length} 条 → HTTP ${res.status}`);
  if (res.status !== 200 && res.status !== 202) {
    console.error(await res.text());
    process.exit(1);
  }
}
