import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@x-ac/web-design-react/style.css";
import "../../src/styles.css";
import "./styles.css";
import App from "./App";
import { installExternalMock } from "./mock/install-mock";

// 静态示例站没有后端：拦截 /mock/api/* 返回本地 JSON，让外部数据源示例真实可用。
installExternalMock();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
