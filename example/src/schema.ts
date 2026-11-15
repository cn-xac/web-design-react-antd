/**
 * 示例预置 Schema：一份 PageSchema 同时喂给设计器与渲染器。
 *
 * 刻意覆盖三类能力，用来证明「引擎只提供架构，适配包只注册组件与配置」：
 * 1. 全部协议物料（29 个 core，含 row / col 统一栅格 + 3 个 antd 专有），按布局 / 展示 / 表单分组；
 * 2. 两级嵌套子表单（订单 → 商品明细），演示理论无限级的明细数组；
 * 3. 真实动作链（toast / setState / resetForm / submitForm）与必填校验。
 *
 * 注意：Schema 里写的是协议物料名（ec-xxx），core 的 materialKey 会归一；
 * 节点 id 同时是自动绑定的数据键（form.<id>）。
 */
import { createEmptyPage } from "@x-ac/web-design-core";
import type { ExternalDataSource, PageSchema } from "@x-ac/web-design-core";
import { EXTERNAL_API } from "./mock/install-mock";

export const PAGE_ID = "demo";

/** 分组容器：设计器里能展开看到子节点树 */
const group = (id: string, title: string, children: PageSchema["children"]): PageSchema["children"][number] => ({
  id,
  component: "ec-card",
  props: { title },
  children,
}) as PageSchema["children"][number];

/**
 * 外部数据源（页面级集中配置，节点只用 externalRef 引用）。
 * 四个源覆盖四类能力，数据全部来自 src/mock/external-data.json：
 * - src_dept：选项数据源，页面加载即取部门字典喂给下拉；
 * - src_emp：输入候选，输入 ≥1 字拉员工列表，双映射（回填值 + 候选）；
 * - src_profile：单条对象响应，也会成为一条候选（不需要先包成数组）；
 * - src_goods：子表单子映射，把响应数组逐行映射成明细对象。
 */
const EXTERNAL_SOURCES: Record<string, ExternalDataSource> = {
  src_dept: {
    id: "src_dept",
    name: "部门字典（选项数据源）",
    url: EXTERNAL_API.departments,
    asOptions: true,
    listField: "list",
    responses: [
      {
        scopePath: "options.x_dept",
        shape: "select",
        labelField: "deptName",
        valueField: "deptCode",
      },
    ],
  },
  src_emp: {
    id: "src_emp",
    name: "员工搜索（选中后回填个人档案）",
    url: EXTERNAL_API.employees,
    triggerLength: 1,
    // 列表字段属于数据源：数组里的每一项都会变成一条候选
    listField: "list",
    responses: [
      // 候选源：写给「数据源拥有者」这个输入框（员工搜索）
      {
        scopePath: "options.x_emp",
        shape: "select",
        labelField: "empName",
        valueField: "empId",
        display: "{{data.empName}} · {{data.deptName}}",
      },
      // 回填目标：选中某条候选后，把这条记录的其它字段写进个人档案
      {
        scopePath: "form.x_profile",
        shape: "form",
        display: "{{data.empName}} · {{data.deptName}} · {{data.mobile}}",
      },
    ],
  },
  src_goods: {
    id: "src_goods",
    name: "订单明细（子表单子映射）",
    url: EXTERNAL_API.orderDetails,
    listField: "list",
    responses: [
      {
        scopePath: "form.externalGoods",
        shape: "form",
        subMaps: [
          { field: "xg_name", from: "goodsName" },
          { field: "xg_qty", from: "qty" },
          { field: "xg_price", from: "price" },
        ],
      },
    ],
  },
};

export function seedPage(): PageSchema {
  return {
    ...createEmptyPage("Ant Design 适配层完整示例"),
    id: PAGE_ID,
    // 外部数据源的兜底值放进 state，设计器画布（不真取数）同样能看到效果；
    // 渲染器由宿主传入 seedData（优先），dev 下再被接口结果覆盖。
    state: {
      form: {
        x_profile: "",
        externalGoods: [
          { xg_name: "机械键盘", xg_qty: 2, xg_price: 399 },
          { xg_name: "27 寸显示器", xg_qty: 1, xg_price: 1299 },
        ],
      },
      options: {
        x_dept: [
          { label: "技术中心", value: "D001" },
          { label: "产品中心", value: "D002" },
        ],
        x_emp: [
          { label: "张三 · 技术中心", value: "E1001" },
          { label: "李四 · 产品中心", value: "E1002" },
        ],
      },
    },
    externalSources: EXTERNAL_SOURCES,
    children: [
      {
        id: "n_title",
        component: "ec-title",
        props: { text: "员工信息登记", level: 3 },
      },
      {
        id: "n_intro",
        component: "ec-alert",
        props: {
          type: "info",
          message: "本页全部控件来自 @x-ac/web-design-react-antd 注册的 Ant Design 组件",
          description: "渲染器只消费组件、导出数据、派发事件；设计器与渲染器共用同一份 Schema。",
        },
      },
      {
        id: "n_toolbar",
        component: "ec-space",
        children: [
          {
            id: "n_tag_new",
            component: "ec-tag",
            props: { color: "blue", text: "antd 6.7" },
          },
          {
            id: "n_link",
            component: "ec-link",
            props: { text: "适配层说明", href: "https://github.com/cn-xac/web-design-react-antd" },
          },
        ],
      } as PageSchema["children"][number],
      { id: "n_divider", component: "ec-divider", props: { text: "基础信息" } },

      group("g_basic", "基础信息", [
        {
          id: "n_grid_basic",
          component: "ec-grid",
          props: { columns: 2 },
          children: [
            {
              id: "n_name",
              component: "ec-input",
              props: { label: "姓名", placeholder: "请输入姓名", clearable: true, maxlength: 20 },
              rules: [{ type: "required", message: "请填写姓名" }],
            },
            {
              id: "n_dept",
              component: "ec-select",
              props: {
                label: "部门",
                options: "技术中心,产品中心,设计中心",
                placeholder: "请选择部门",
                clearable: true,
                showSearch: true,
              },
            },
            { id: "n_count", component: "ec-number", props: { label: "司龄", min: 0, max: 50, precision: 0 } },
            { id: "n_join", component: "ec-date", props: { label: "入职日期", valueFormat: "YYYY-MM-DD" } },
          ],
        } as PageSchema["children"][number],
      ]),

      group("g_visibility", "显示 / 隐藏条件（r5u4Ul）", [
        {
          id: "n_v_tip",
          component: "ec-alert",
          props: {
            type: "info",
            message: "一组条件 + 命中动作，未命中自动取反",
            description: "切换「部门」「远程办公」「司龄」观察下方字段显隐；上方「强制隐藏」开关演示宿主 force 覆盖本地条件。",
            showIcon: true,
          },
        },
        {
          id: "n_grid_visibility",
          component: "ec-grid",
          props: { columns: 2, gap: 16 },
          children: [
            {
              id: "n_v_show",
              component: "ec-input",
              props: { label: "命中显示（部门=技术中心）", placeholder: "改成产品中心即隐藏" },
              visibility: {
                action: "show",
                when: { mode: "and", rows: [{ left: "form.n_dept", operator: "eq", value: "技术中心" }] },
              },
            },
            {
              id: "n_v_hide",
              component: "ec-input",
              props: { label: "命中隐藏（远程办公为真）", placeholder: "关掉远程办公即显示" },
              visibility: {
                action: "hide",
                when: { mode: "and", rows: [{ left: "form.n_remote", operator: "truthy" }] },
              },
            },
            {
              id: "n_v_advanced",
              component: "ec-text",
              props: { text: "高级条件命中显示：1 and (2 or 3)｜条件 1 为真、条件 2 为假、条件 3 取「司龄 > 0」。司龄归零即隐藏。" },
              visibility: {
                action: "show",
                when: {
                  mode: "advanced",
                  expression: "1 and (2 or 3)",
                  rows: [
                    { value: "true" },
                    { value: "false" },
                    { left: "form.n_count", operator: "gt", value: 0 },
                  ],
                },
              },
            },
          ],
        },
      ]),

      group("g_extra", "扩展字段（antd 专有与业务语义物料）", [
        {
          id: "n_grid_extra",
          component: "ec-grid",
          props: { columns: 2 },
          children: [
            { id: "n_remark", component: "ec-textarea", props: { label: "备注", rows: 3, showCount: true } },
            { id: "n_amount", component: "ec-amount-input", props: { label: "预算", precision: 2, currency: "¥" } },
            { id: "n_level", component: "ec-segmented", props: { label: "职级", options: "P4,P5,P6,P7" } },
            { id: "n_color", component: "ec-color", props: { label: "主题色", showAlpha: false } },
            { id: "n_radio", component: "ec-radio", props: { label: "办公方式", options: "现场,混合,远程" } },
            { id: "n_checkbox", component: "ec-checkbox", props: { label: "技能", options: "Vue,React,TypeScript" } },
            {
              id: "n_dict",
              component: "ec-dict-select",
              props: { label: "字典项", options: "草稿,待审,已发布", clearable: true },
            },
            { id: "n_org", component: "ec-org-picker", props: { label: "所属组织" } },
            { id: "n_cascader", component: "ec-cascader", props: { label: "地区", options: "华东,华南" } },
            { id: "n_rate", component: "ec-rate", props: { label: "满意度", count: 5, allowHalf: true } },
            { id: "n_slider", component: "ec-slider", props: { label: "投入占比", min: 0, max: 100, step: 5 } },
            { id: "n_remote", component: "ec-switch", props: { label: "远程办公", activeText: "是", inactiveText: "否" } },
          ],
        } as PageSchema["children"][number],
      ]),

      group("g_display", "展示类物料", [
        {
          id: "n_text",
          component: "ec-text",
          props: { text: "下表数据来自 page.state / data 的作用域，用 {{list}} 绑定。" },
        },
        {
          id: "n_table",
          component: "ec-table",
          props: {
            columns: [
              { label: "姓名", prop: "name" },
              { label: "部门", prop: "dept" },
              { label: "状态", prop: "status" },
            ],
            data: "{{list}}",
          },
        },
        { id: "n_image", component: "ec-image", props: { src: "", alt: "占位图", width: 96, height: 64 } },
        { id: "n_container", component: "ec-container", props: { padding: 8 }, children: [
          { id: "n_nested_text", component: "ec-text", props: { text: "容器内可以放任意子节点" } },
        ] } as PageSchema["children"][number],
      ]),

      group("g_external", "外部数据源（页面级配置 → 元素消费）", [
        {
          id: "x_external_tip",
          component: "ec-alert",
          props: {
            type: "success",
            message: "外部数据源示例（静态站内置 mock，无需后端）",
            description:
              "数据来自 src/mock/external-data.json。部门下拉=选项数据源；员工搜索=输入候选（输入「张」或「李」）；个人档案=显示内容模板回填；下方明细=子表单子映射。dev 下页面加载即真实取数，build 产物用同值兜底。",
            showIcon: true,
          },
        },
        {
          id: "n_grid_external",
          component: "ec-grid",
          props: { columns: 2 },
          children: [
            {
              id: "x_dept",
              component: "ec-select",
              props: {
                label: "部门（远程选项）",
                placeholder: "选项来自 /mock/api/departments",
                options: "{{options.x_dept}}",
                clearable: true,
                showSearch: true,
              },
              externalRef: "src_dept",
            },
            {
              id: "x_emp",
              component: "ec-input",
              props: {
                label: "员工搜索（输入候选）",
                placeholder: "输入「张」或「李」试试",
                options: "{{options.x_emp}}",
                clearable: true,
              },
              externalRef: "src_emp",
            },
            {
              id: "x_profile",
              component: "ec-input",
              props: {
                label: "个人档案（选中员工后回填）",
                placeholder: "在上方选一个员工",
              },
            },
          ],
        } as PageSchema["children"][number],
        {
          id: "x_goods_form",
          component: "ec-subform",
          props: { label: "订单明细（外部数据源子映射）", itemPath: "externalGoods", addText: "添加明细" },
          children: [
            { id: "xg_name", component: "ec-input", props: { label: "商品名" }, externalRef: "src_goods" },
            { id: "xg_qty", component: "ec-number", props: { label: "数量", min: 1, precision: 0 } },
            { id: "xg_price", component: "ec-number", props: { label: "单价", min: 0, precision: 2 } },
          ],
        } as PageSchema["children"][number],
      ]),

      group("g_grid", "栅格布局（row / col，core 通用 24 栅格）", [
        {
          id: "n_row_demo",
          component: "ec-row",
          props: { gutter: 16, gutterVertical: 16 },
          children: [
            {
              id: "n_col_a",
              component: "ec-col",
              props: { span: 12 },
              children: [{ id: "n_col_a_name", component: "ec-input", props: { label: "左列：姓名" } }],
            } as PageSchema["children"][number],
            {
              id: "n_col_b",
              component: "ec-col",
              props: { span: 12 },
              children: [
                { id: "n_col_b_dept", component: "ec-select", props: { label: "右列：部门", options: "技术中心,产品中心" } },
              ],
            } as PageSchema["children"][number],
          ],
        } as PageSchema["children"][number],
        {
          id: "n_row_responsive",
          component: "ec-row",
          props: { gutter: 8 },
          children: [
            {
              id: "n_col_resp",
              component: "ec-col",
              props: { span: 24, xs: 24, sm: 12, md: 8, lg: 6, xl: 4 },
            },
          ],
        } as PageSchema["children"][number],
      ]),

      {
        id: "orders",
        component: "ec-subform",
        props: { label: "订单（一级子表单）", itemPath: "orders", addText: "添加订单" },
        children: [
          { id: "o_no", component: "ec-input", props: { label: "订单号", placeholder: "如 A001" } },
          { id: "o_amount", component: "ec-number", props: { label: "金额", min: 0, precision: 2 } },
          {
            id: "goods",
            component: "ec-subform",
            props: { label: "商品明细（嵌套二级）", itemPath: "goods", addText: "添加商品" },
            children: [
              { id: "g_name", component: "ec-input", props: { label: "商品名" } },
              { id: "g_qty", component: "ec-number", props: { label: "数量", min: 1, precision: 0 } },
            ],
          } as PageSchema["children"][number],
        ],
      } as PageSchema["children"][number],

      {
        id: "n_actions",
        component: "ec-space",
        children: [
          {
            id: "n_submit",
            component: "ec-button",
            props: { text: "提交并校验", type: "primary" },
            events: {
              click: [
                { action: "toast", args: { text: "正在提交…", type: "info" } },
                // reset:false 保留表单值，方便反复演示；默认行为是提交后清空
                { action: "submitForm", args: { from: "form", to: "rows", reset: false, successText: "提交成功" } },
              ],
            },
          },
          {
            id: "n_fill",
            component: "ec-button",
            props: { text: "写入示例值" },
            events: {
              click: [
                { action: "setState", args: { path: "form.n_name", value: "王五" } },
                { action: "toast", args: { text: "已把姓名写为 王五", type: "success" } },
              ],
            },
          },
          {
            id: "n_reset",
            component: "ec-button",
            props: { text: "重置表单", danger: true },
            events: {
              click: [
                { action: "confirm", args: { text: "确定要清空表单吗？", then: [
                  { action: "resetForm", args: { path: "form" } },
                ] } },
              ],
            },
          },
        ],
      } as PageSchema["children"][number],
    ] as PageSchema["children"],
  };
}

/** 初始数据：键 = 完整 node.id（自动绑定规则），rows 供 submitForm 追加 */
export const seedData = {
  form: {
    n_name: "张三",
    n_dept: "技术中心",
    n_count: 3,
    n_join: "2024-03-01",
    n_remark: "Schema 驱动渲染示例",
    n_amount: 12800.5,
    n_level: "P5",
    n_color: "#1677ff",
    n_radio: "混合",
    n_checkbox: ["React", "TypeScript"],
    n_dict: "已发布",
    n_org: "hq-tech",
    n_cascader: ["华东"],
    n_rate: 4.5,
    n_slider: 60,
    n_remote: true,
    // 外部数据源兜底值：build 产物（无运行时取数）直接显示这些，dev 下会被接口结果覆盖
    x_emp: "",
    x_profile: "",
    externalGoods: [
      { xg_name: "机械键盘", xg_qty: 2, xg_price: 399 },
      { xg_name: "27 寸显示器", xg_qty: 1, xg_price: 1299 },
    ],
    orders: [
      {
        o_no: "A001",
        o_amount: 899,
        goods: [
          { g_name: "机械键盘", g_qty: 1 },
          { g_name: "显示器", g_qty: 2 },
        ],
      },
    ],
  },
  // 选项数据源 / 输入候选的静态兜底（dev 下由外部数据源按 mock 响应覆盖）
  options: {
    x_dept: [
      { label: "技术中心", value: "D001" },
      { label: "产品中心", value: "D002" },
      { label: "设计中心", value: "D003" },
      { label: "市场中心", value: "D004" },
    ],
    x_emp: [
      { label: "张三 · 技术中心", value: "E1001" },
      { label: "李四 · 产品中心", value: "E1002" },
      { label: "王五 · 设计中心", value: "E1003" },
      { label: "赵六 · 市场中心", value: "E1004" },
    ],
  },
  rows: [],
  list: [
    { name: "张三", dept: "技术中心", status: "在职" },
    { name: "李四", dept: "产品中心", status: "在职" },
  ],
};
