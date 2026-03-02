# 蔷薇牢笼 — AI 被囚禁恋爱模拟器

React 19 + Zustand 5 + Immer + Vite 7 + Tailwind CSS v4 + Framer Motion + Cloudflare Pages

## 架构

```
20list-qiangwei/
├── worker/index.js              - ☆ CF Worker API 代理（备用，未部署）
├── public/
│   ├── audio/bgm.mp3            - 背景音乐
│   ├── characters/              - 4 角色立绘 9:16 竖版 (1440x2560)
│   └── scenes/                  - 5 场景背景 9:16 竖版 (1440x2560)
├── src/
│   ├── main.tsx                 - ☆ React 入口
│   ├── vite-env.d.ts            - Vite 类型声明
│   ├── App.tsx                  - 根组件: 三阶段开场(黑屏醒来→诡异字条→姓名输入) + GameScreen + EndingModal
│   ├── lib/
│   │   ├── script.md            - ★ 剧本直通：五模块原文（零转换注入 prompt）
│   │   ├── data.ts              - ★ UI 薄层：类型 + 4角色 + 5场景 + 6道具 + 4章节 + 7事件 + 8结局
│   │   ├── store.ts             - ★ 状态中枢：Zustand + 富消息 + 抽屉 + 双轨解析 + 兄弟嫉妒链式反应
│   │   ├── parser.ts            - AI 回复解析（4角色着色 + 数值着色）
│   │   ├── analytics.ts         - Umami 埋点（qw_ 前缀）
│   │   ├── stream.ts            - ☆ SSE 流式通信
│   │   ├── bgm.ts               - ☆ 背景音乐
│   │   └── hooks.ts             - ☆ useMediaQuery / useIsMobile
│   ├── styles/
│   │   ├── globals.css          - 全局基础样式（qw- 前缀，暗红黑金主题）
│   │   ├── opening.css          - 开场样式：黑屏醒来 + 诡异字条 + 姓名输入
│   │   └── rich-cards.css       - 富UI组件：场景卡 + 日变卡 + NPC气泡 + 囚笼手记 + 事件记录 + 档案 + 关系图
│   └── components/game/
│       ├── app-shell.tsx        - 居中壳 + Header + 三向手势 + Tab路由 + TabBar + 抽屉 + 菜单
│       ├── dashboard-drawer.tsx - 囚笼手记(左抽屉)：扉页+亲密度速览+场景图+目标+属性+背包
│       ├── tab-dialogue.tsx     - 对话Tab：富消息路由 + 可折叠选项面板 + 输入区
│       ├── tab-scene.tsx        - 场景Tab：9:16大图 + 地点列表
│       └── tab-character.tsx    - 人物Tab：立绘 + 数值 + SVG关系图 + 角色网格 + 全屏档案
├── index.html
├── package.json
├── vite.config.ts               - ☆
├── tsconfig*.json               - ☆
└── wrangler.toml                - ☆
```

## 核心设计

- **囚禁恋爱模拟**：3 继兄 + 1 管家，30 天别墅囚禁
- **双轨数值**：5 全局属性（体力/心理/警觉/伪装/线索）+ NPC 好感/信任
- **暗红黑金主题**：深黑底(#0a0408)+暗玫红(#9e1b32)+金色(#c9a84c)，qw- CSS 前缀
- **3 时段制**：每天 3 时段（早晨/午后/夜晚），共 90 时间槽
- **剧本直通**：script.md 存五模块原文，?raw import 注入 prompt
- **8 结局**：BE×2 + TE×2 + HE×3 + NE×1，优先级 BE→TE→HE→NE

## 链式反应

- 兄弟嫉妒效应：任一哥哥好感≥70时，其他哥哥好感>30的自动-3
- 每日被动衰减：体力-2，心理-3

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
