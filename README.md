# 个人网站

我的个人网站源码，包含前端页面、后端服务和 Minecraft 服务器状态 API。

## 目录结构

`
├── index.html          # 主页面
├── styles.css          # 样式表
├── *.js                # 前端功能脚本
├── *.html              # 其他页面（404, dino, guestbook, quiz）
├── mc-api/             # Minecraft 服务器状态 API（Flask）
│   └── app.py
├── server/             # 后端服务
│   ├── cpp/            # C++ hakimi 引擎
│   ├── node_bridge/    # Node.js 桥接服务
│   └── starthd2.bat    # 启动脚本
└── README.md
`

## 环境要求

### 1. Node.js（用于 hakimi 桥接服务 bridge.js）

- Node.js v20.18.3（LTS）
- npm v10.8.2
- 必需的 npm 包：express ^4.18.2、uuid 8.3.2（CommonJS 兼容版本）、cors ^2.8.5

> uuid 必须使用 8.3.2，因为新版本是 ESM 格式，Node 端 require 会报错。

### 2. Python（用于 Flask 后端 app.py）

- Python 3.8+（推荐 3.10+）
- 必需的 pip 包：
  - flask 2.x
  - mcstatus ^11.0+
  - geoip2 ^4.8（可选，若使用本地 MaxMind 数据库）
  - requests ^2.31.0

### 3. C++ 编译工具（用于生成 hakimi_engine.exe）

- 编译器：MinGW-w64（GCC 16.1.0，建议静态链接 -static）
- C++ 标准：C++11

### 4. 其他

- nginx 1.20+

## 端口占用

| 端口 | 用途 |
|------|------|
| 14514 | HTTPS（Nginx 监听） |
| 14513 | HTTP 重定向（若配置了） |
| 3000  | Node.js 桥接服务（仅本地 127.0.0.1） |
| 5000  | Flask 后端（仅本地 127.0.0.1） |

## 注意事项

- C++ 程序编译时建议添加 -static 标志，避免运行时缺少 libstdc++-6.dll。
- Python 的 mcstatus 需要网络访问权限，用于查询外部 Minecraft 服务器。
