import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * 本地联调上游引擎源码时的 alias，与根目录 vitest.config.ts 的四条保持同源。
 * 顺序敏感：更长的路径必须排在包别名之前，否则 `@x-ac/web-design-react/style.css`
 * 会被拼成 `src/index.ts/style.css`，子入口 /kit /designer 同理。
 */
const LOCAL_ENGINE_ALIAS = [
  { find: "@x-ac/web-design-react/style.css", replacement: r("../../project/packages/react/src/styles.css") },
  { find: "@x-ac/web-design-react/designer", replacement: r("../../project/packages/react/src/designer.ts") },
  { find: "@x-ac/web-design-react/kit", replacement: r("../../project/packages/react/src/kit.ts") },
  { find: "@x-ac/web-design-react", replacement: r("../../project/packages/react/src/index.ts") },
  { find: "@x-ac/web-design-core", replacement: r("../../project/packages/core/src/index.ts") },
];

/**
 * 示例站构建：base 始终保持 '/'，GitHub Pages 的 /<repo>/ 子路径由 tools/pages.mjs 覆盖。
 *
 * 引擎解析策略（关键）：
 * - `serve`（pnpm dev）：alias 到兄弟仓 project/packages/{core,react}/src，
 *   浏览器里跑的就是当前工作区的 1.3.0 引擎（含 visibility / ConditionBuilder）；
 * - `build`（build:example / pages:build）：不启用 alias，仍解析 node_modules 的已发布
 *   ^1.0.0 依赖，保证 Pages 产物与 npm 发布链路一致，不把本地源码打进静态资源。
 */
export default defineConfig(({ command }) => {
  const local = command === "serve";

  return {
    root: r("."),
    base: "/",
    plugins: [react()],
    resolve: {
      dedupe: [
        "react",
        "react-dom",
        "antd",
        ...(local ? ["@x-ac/web-design-core", "@x-ac/web-design-react"] : []),
      ],
      alias: [
        // 本包走源码，示例改动即刻生效，不依赖 dist
        { find: "@x-ac/web-design-react-antd", replacement: r("../src/index.tsx") },
        ...(local ? LOCAL_ENGINE_ALIAS : []),
      ],
    },
    build: {
      outDir: r("./dist"),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          /**
           * 按「变更频率」拆包，而不是盲目切成一堆小文件：
           * - vendor-antd：antd + @rc-component + React 运行时，几乎不变，浏览器可长期缓存；
           * - engine：已发布的 @x-ac/web-design-core / @x-ac/web-design-react 依赖，随引擎发版变化；
           * - 入口 chunk：适配包 + 示例业务代码，改动后只失效这一部分。
           */
          manualChunks(id) {
            if (id.includes("node_modules/.pnpm/antd@") || id.includes("/antd/es/") || id.includes("/@rc-component/")) return "vendor-antd";
            if (id.includes("node_modules/@x-ac/web-design-")) return "engine";
            return undefined;
          },
        },
      },
    },
    server: { port: 5176, host: "127.0.0.1" },
  };
});
