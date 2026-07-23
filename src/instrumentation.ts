export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.GLOBAL_AGENT_HTTP_PROXY
  ) {
    const { bootstrap } = await import("global-agent");
    bootstrap();
  }
}
