# Seasons of the year · 朱迪的四季课堂

当前版本：3.0.0，2026-11-17。本地成品、交付包及两个线上入口已通过验收，GitHub、Vercel 与 CloudBase 均已更新。

## 唯一课件依据

`../11.17 seasons-1.pptx`，22 页。原文件保持不变。

SHA-256：`8a288a90411da894359cb80c9a8d361f669f32d00e5ef7816eeba1fad9c75e26`

课堂顺序为原 PPT 的 **Winter → Spring → Summer → Autumn**，分别进入第 5、8、11、14 页。首页、目录、地图和章节导航都使用这一顺序。第 19 页导览创作示例仍按原页的春、夏、秋、冬排列。

主画面采用原版排版与素材，共 131 个显现状态；可以逐步前进、回退、重放、显示完整页、全屏和放大查看。地图可点击四个岛屿。第 9、15 页播放 PPT 内嵌视频，播放入口随原对象出现。

朱迪使用 J.C. Thornton 的全身骨骼模型，经过网页材质与纹理优化，保留 114 个骨骼节点，提供眨眼、头耳与手臂轻动、随语音变化的口型。拖动可转身，点击或键盘可播放、停止讲解。模型约 7.31 MB，来源与角色归属见 `public/models/judy/CREDITS.txt`。

61 段英语讲解、诗歌、词汇和示例使用用户确认的合成音色方向，共约 349 秒；以生成试听为参考，不使用电影原声或演员录音。22 页讲解可切换中英文字并自动跟随翻页。pool、crop 使用界面展示的原诗例句，避免孤立短词的发音歧义。第 16–19 页还支持 13 个词汇听读、原文 8 空练习及四季导览录音；思考和诗歌可编辑下载。

## 打开与交付

- 开发预览：`npm run dev -- --host 127.0.0.1 --port 5173`
- 编译：`npm run build`
- 打包：`python3 scripts/package_delivery.py`
- 交付文件夹：`../Seasons_朱迪互动课件/`
- 交付压缩包：`../Seasons_朱迪3D互动课件_v3_20261117.zip`

交付文件夹内双击 `启动课件.command` 即可在本机浏览器打开；启动器只监听本机，需要 Python 3。文件夹可整体发布到 HTTPS 静态站点，资源路径支持子目录，不依赖运行时生成服务。请使用网页地址打开，不能直接双击 `index.html`。

## 保真范围

`src/ppt-manifest.json` 记录原文件哈希、逐页画面、地图与视频位置。`scripts/build_ppt_frames.py` 从原 PPT 的对象动画读取显现/退出顺序，在 `.work` 中生成临时展开副本，原件只读。使用 LibreOffice 导出 PDF 后转为 WebP。

飞入、旋转、连续路径及强调特效简化为离散画面；部分仅改变强调的步骤合并。地图里的四个自动尺寸文本框在渲染副本中加宽，防止 LibreOffice 错误换行。字体与 Office 渲染可能存在细微差异。原文字、版面、图片、影片和教学顺序是主线。

可选的环顾场景使用生成的四季插画和 Three.js，以镜像边界衔接整圈；它不替换原 PPT。支持设备会显示 WebXR 入口，但未进行真实头显验收。

原稿、早先的 `11.17 seasons.pptx` 都保留。旧四年级 PPT 已按用户明确授权删除，旧网页代码备份位于 `../.work/seasons/四年级试用版_代码备份.zip`。

## 验收证据

验收结果保存在 `qa/acceptance-*.json`，关键界面截图保存在 `qa/*.jpg`。媒体完整性和原稿哈希保存在 `qa/asset-integrity.json`。

已完成 Chrome 浏览器完整课程测试：22 页 / 131 状态、四季入口、地图、键盘和逐步控制、朱迪实际音频播放及跟随翻页、两段原视频、词汇、8 空反馈、模拟麦克风录音与下载、作品下载、WebGL 场景。视口覆盖 1440×900、1024×768、768×1024、390×844、375×812。未使用真实环境录音；未进行 Safari、手机实机和 VR 头显测试。

交付包 41.24 MB，ZIP 完整性通过，逐文件与编译结果一致。已通过自带本机启动器复验课件、音频、全屏、视频及场景；麦克风拒绝、存储不可用与 WebGL 不可用时仍可继续相应降级功能。`qa/acceptance-delivery.json` 记录该项复验。

开发环境复核：

```sh
npm ci
npm run build
node scripts/verify-browser.cjs lesson
node scripts/verify-browser.cjs activities
node scripts/verify-browser.cjs responsive
TEST_URL=http://127.0.0.1:8767/ node scripts/verify-browser.cjs delivery
```

浏览器检查使用独立 Playwright，可用 `PLAYWRIGHT_PATH` 指定其安装位置，`TEST_URL` 指定待测地址。默认使用本机已有工具，不新增网络服务。

## 发布状态

2026-11-17 发布完成。应用代码版本 `c62b1a1`；后续提交只补充验收及发布记录。

- GitHub：[MOCCMO/vr-ppt](https://github.com/MOCCMO/vr-ppt)，`main` 已同步。
- Vercel：[备用入口](https://vr-ppt-theta.vercel.app/)，沿用 `vr-ppt` 项目；生产部署 `dpl_8sqCMcpb4C5b3bKztAPWr9tnUSJw` 为 READY。
- CloudBase：[国内入口](https://season-quest-d1g08nncm027cf211-1465578399.tcloudbaseapp.com/)，沿用上海体验环境 `season-quest-d1g08nncm027cf211`；274 个文件上传成功，发布一致性校验通过。旧课堂的两份入口脚本/样式已撤下，平台认证目录保留。
- 邮件：国内链接、首次访问说明和备用入口已发送至用户指定学习邮箱，发送服务已返回 SENT。
- Colab：两个临时任务均已结束；余额由 199.76 降至 198.34，当前无运行任务，无充值。

CloudBase 使用体验环境的默认测试域名，首次浏览器访问需在腾讯云提示页倒计时结束后点击「确定访问」。这是平台的默认域名机制，参见[官方说明](https://docs.cloudbase.net/service/alias)。长期对外使用应配置自己的域名；本次没有新购套餐或域名。

两个线上入口均实际验证了季节入口、3D 模型、英语讲解与口型、两段原视频、词汇原文例句和 390px 手机布局。CloudBase 首页、模型、声音、原视频和课件画面抽样逐字节匹配本地编译文件；全部文件另经上传一致性校验。证据：`qa/cloudbase-live.json`、`qa/vercel-live.json`、`qa/cloudbase-asset-check.json`。首次腾讯云提示页的预期 404 已单独记录，不计作课件资源失败。

CloudBase 后续更新命令：

```sh
npm run build
tcb hosting deploy dist -e season-quest-d1g08nncm027cf211 --safe --verify
```

保持根目录参数省略：CLI 3.9.2 的 `--verify` 在显式 `/` 路径下会产生前导斜杠匹配错误。不要对根目录使用 `--prune`，避免清除平台的认证页面。发布当天，本机代理线路影响腾讯云资源连接，通过仅针对本次进程的直连路由完成上传与浏览器验收，未改动系统代理或证书校验。

完成条件已满足：三处同步同一成品，两个线上入口实测通过，国内地址已通过邮件发送。剩余边界：尚未进行 Safari、手机实机、真实麦克风和 VR 头显验收。
