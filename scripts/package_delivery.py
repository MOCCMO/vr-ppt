"""Package the already built, self-contained lesson; never touches source PPTs."""
from pathlib import Path
import json, shutil
from zipfile import ZipFile, ZIP_DEFLATED
base = Path(__file__).resolve().parents[1]
source = base / 'dist'
destination = base.parent / 'Seasons_朱迪互动课件'
archive = base.parent / 'Seasons_朱迪3D互动课件_v3_20261117.zip'
if not (source / 'index.html').exists():
    raise SystemExit('Run npm run build first.')
if destination.exists():
    marker = destination / 'lesson-delivery.json'
    if not marker.exists() or json.loads(marker.read_text()).get('application') != 'seasons-judy-classroom':
        raise SystemExit(f'Existing unrecognized folder: {destination}')
    shutil.rmtree(destination)
shutil.copytree(source, destination)
for item in (base / 'scripts/launcher').iterdir():
    if item.is_file():
        shutil.copy2(item, destination / item.name)
(destination / '启动课件.command').chmod(0o755)
manifest = json.loads((base / 'src/ppt-manifest.json').read_text())
(destination / 'lesson-delivery.json').write_text(json.dumps({'application': 'seasons-judy-classroom','version':'3.0.0','source':manifest['source'],'sourceSha256':manifest['sha256'],'slides':22,'frames':131},ensure_ascii=False,indent=2))
(destination / '使用说明.txt').write_text('''Seasons of the year · 朱迪的四季课堂

本版以 11.17 seasons-1.pptx 为准，共 22 页。
按原课件顺序：冬 → 春 → 夏 → 秋。

在这台 Mac 上：双击「启动课件.command」，浏览器会自动打开。
上课时保留启动窗口，结束后按 Control + C 关闭。
请从浏览器网址打开，不要直接双击 index.html。
本机启动需要 Python 3；当前制作电脑已具备。

点击课件画面、下方「下一步」或按右方向键，逐步显现原课件。
左方向键回退；Page Up / Page Down 直接翻页；F 开启全屏。
点击朱迪或「听朱迪讲这页」播放英语讲解；EN/中 切换提示文字。
勾选「翻页时自动讲解」后，朱迪会跟随翻页。
春、秋课堂保留原课件短片；第 16–19 页可听词汇、填空和录音。
录音只保存在当前页面，请及时下载。文字稿和进度保存在本浏览器。
手机上可点「放大课件」，横向滑动查看。

展示方式：保留原课件版面与对象显现/退出顺序；飞入、旋转等动作简化为逐步展示。
朱迪已升级为可转身查看的全身 3D 模型，带眨眼、转头与随语音变化的嘴型。
英语讲解、原诗、单词和示例使用统一的设计合成音色；不是电影原声录音。
点击朱迪听本页讲解，拖动她可旋转查看。素材来源见 models/judy/CREDITS.txt。
360° 诗境为可选扩展；头显功能需要支持设备，尚未做头显实机测试。

交给网站管理员：把此文件夹的全部文件部署到 HTTPS 静态网站即可。
素材与语音均已随包附带，运行时无需在线生成服务。
''',encoding='utf-8')
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=6) as z:
    for item in sorted(destination.rglob('*')):
        if item.is_file():
            z.write(item, item.relative_to(destination.parent))
with ZipFile(archive) as z:
    assert z.testzip() is None
print(f'Folder: {destination}\nZIP: {archive}\nSize: {archive.stat().st_size / 1048576:.2f} MB')
