"use client";

import { useEffect, useState } from "react";
import { isMobileDevice } from "@/lib/device";

/**
 * 桌面端专属的拍照入口：网页摄像头 + 「用手机继续」二维码。
 * 桌面浏览器会忽略 input 的 capture 属性，所谓「拍一张」其实只会弹出文件选择器，所以桌面上要换成这两个入口（/try 和 /scan 共用这一份判断）。
 *
 * 返回值：
 * - null：手机 / 平板，或者还没挂载（服务端渲染和首次渲染时不知道设备类型，先什么都不显示，避免 hydration 不一致）；
 * - { webcam }：桌面端，webcam 表示浏览器是否提供 getUserMedia（非 https 的环境没有，此时只剩手机接力）。
 */
export function useDesktopTools(): { webcam: boolean } | null {
  const [tools, setTools] = useState<{ webcam: boolean } | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    // iPadOS 的 Safari 默认伪装成 Mac：有多点触控的「Mac」其实是 iPad，它有 capture 相机入口，不算桌面
    const isIPadAsMac = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
    if (isMobileDevice() || isIPadAsMac) return;
    // 设备类型只有挂载后才知道，所以必须在 effect 里设置
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTools({ webcam: typeof navigator.mediaDevices?.getUserMedia === "function" });
  }, []);

  return tools;
}
