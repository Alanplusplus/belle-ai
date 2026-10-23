/** 分享卡的地址和下载文件名。单独成文件：客户端组件（ShareQuizResult）要用，不能把 share-card.ts 里的大批数据打进前端包 */
export function shareCardPath(key: string): string {
  return `/share-cards/${key}.png`;
}

export function shareCardFilename(key: string): string {
  return `belle-ai-${key}.png`;
}
