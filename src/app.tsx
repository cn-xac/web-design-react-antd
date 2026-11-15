/**
 * 可选的宿主包装：让 antd 的 message / Modal 走 App context（推荐用法）。
 *
 * antd 6 的静态 message / Modal.confirm 脱离 React context，拿不到 ConfigProvider
 * 的动态主题；官方推荐用 <App> + App.useApp()。这里提供两个组件：
 * - AntdConfigProvider：ConfigProvider + App 的组合外壳；
 * - AntdAppBridge：放在 App 内部，把 context 实例注入适配包的 actions。
 *
 * 不用也没关系：actions 会自动回落到静态 API，功能不缺失，只是主题不同步。
 */
import type { ReactNode } from "react";
import { useEffect } from "react";
import { App, ConfigProvider } from "antd";
import { setAntdAppContext } from "./actions";

export function AntdAppBridge(): null {
  const ctx = App.useApp();
  useEffect(() => {
    setAntdAppContext(ctx);
    return () => setAntdAppContext(null);
  }, [ctx]);
  return null;
}

export interface AntdConfigProviderProps {
  children?: ReactNode;
}

/**
 * 弹层统一挂到 body。
 *
 * antd 的 Select / TreeSelect / Cascader / DatePicker 等弹层若留在局部容器里，
 * 会被容器的 overflow 裁剪、或与被撑高的兄弟层叠压住（表现是「下拉出来了但在下面」）。
 * 挂到 body 后只受视口约束，层级也不受局部 stacking context 影响。
 */
const toBody = (): HTMLElement => document.body;

/**
 * 弹层基准层级：antd 默认 zIndexPopupBase=1000（下拉即 1050），
 * 而设计器弹窗 .wbd-modal 是 2000，弹窗内的下拉会被压在下面。
 * 抬到 3000 让弹层恒在弹窗之上（styles.css 里还有一条 !important 兜底）。
 */
const THEME = { token: { zIndexPopupBase: 3000 } };

/**
 * 纯主题 / 弹层容器 Provider（renderless，不插入任何 DOM）。
 *
 * 作为 UiAdapter.provider 交给引擎：SchemaRenderer 与 SchemaDesigner 会自动在根节点包一层，
 * 宿主不必再手动套 AntdConfigProvider。antd 的 ConfigProvider 不产生包裹元素，
 * 因此不影响原有高度链与样式选择器（这点和 <App> 不同，<App> 会插一层 div.ant-app）。
 *
 * 需要 App context（message / Modal 的主题同步）时，宿主仍可在外层再套 AntdConfigProvider。
 */
export function AntdThemeProvider({ children }: { children?: ReactNode }) {
  return (
    <ConfigProvider getPopupContainer={toBody} theme={THEME}>
      {children}
    </ConfigProvider>
  );
}

export function AntdConfigProvider({ children }: AntdConfigProviderProps) {
  return (
    <ConfigProvider getPopupContainer={toBody} theme={THEME}>
      <App>
        <AntdAppBridge />
        {children}
      </App>
    </ConfigProvider>
  );
}
