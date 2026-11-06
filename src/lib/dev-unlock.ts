/**
 * 本地开发用的「查看完整报告」开关（不用模拟付费）。
 * 开关写在这个 cookie 里；/api/belle 代理在 development 模式下看到它就给后端带上 X-Dev-Unlock: 1，
 * 后端还要用环境变量 DEV_UNLOCK_REPORTS=1 启动才会认。生产构建里代理不会带这个头。
 */
export const DEV_UNLOCK_COOKIE = "belle_dev_unlock";
