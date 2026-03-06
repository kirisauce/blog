---
title: 在Linux上启动洛克王国（页游）
tags: [
  linux,
  游戏,
]
---
## 背景
众所周知，洛克王国是由腾讯开发的一款页游，依赖Flash运行。而又因为众所周知的原因，Flash官方版已经似了有几年了(除了国内代理商重庆重橙维护的[Flash中心](https://flash.cn/)，但是flash中心的Linux版只有商业授权)。so we只能另辟蹊径。

## Ruffle
6202年了，玩Flash游戏谁还用Flash Player啊，快来试试Rust重写的Flash Player（

好了，这是最简单的方案，适用于绝大部分Flash游戏，但是却不适用于洛克。原因如下：

![cors-denied](./roco-kingdom/cors-denied.avif "长期跨域导致的")

腾讯的Nginx没配置好跨域规则。主域名是`17roco.qq.com`，而游戏的`.swf`资源文件放在`res.17roco.qq.com`域名下，导致Ruffle没法获取游戏文件。而当你点击这个按钮后，Ruffle会新开一个标签页运行游戏swf文件，看起来正常了，实际上还是寄：

![fake-success](./roco-kingdom/ruffle-fake-success.avif "假滴")

狂点"开始"。真是奇怪Le，怎么没反应？实际上是因为开始按钮在正常的网页中会跳转到QQ登录页面，而Ruffle的这个页面实质上只有swf解释器功能，不支持跳转。

那有没有什么方法能把CORS限制关掉？有的兄弟有的，Chromium可关。只需提供两个参数`--disable-web-security`和`--user-data-dir=[你的自定义数据目录]`。把CORS限制关闭之后，我们就可以在`https://17roco.qq.com/`继续登录游戏。但是登录完之后又有个问题，就是游戏没法获取服务器列表了。

![ruffle-failed-login](./roco-kingdom/ruffle-failed-login.avif)

经过抓包，似乎是游戏会直接调用`socket`从服务器获取数据，但是浏览器环境下的Ruffle无法创建socket。这就不好办了，单独的Ruffle程序又无法调用登录页面，**所以ruffle这条路是走不通了**。

-----------------------------------------------

## Adobe Flash Player
众所周知，Flash有三个版本，分别是`Flash Player ActiveX`(适用于IE)，`Flash Player NPAPI`(Netscape Plugin API，适用于Firefox)和`Flash Player PPAPI`(也叫`PepperFlash`，曾由Google维护)。其中NPAPI和PPAPI版本支持Linux。我们这里选择Chromium支持较好的PPAPI版本。

### 下载
那么我们要去哪里找呢？Adobe已经把所有Flash相关的链接全部重定向到了`flash.cn`。[`Wayback Machine`](https://web.archive.org/)启动！

[Adobe的Flash历史版本存档页面的存档](https://web.archive.org/web/20200701045943/https://helpx.adobe.com/flash-player/kb/archived-flash-player-versions.html)

[Flash 32.0.0.371存档的存档](https://web.archive.org/web/20200701045943/https://fpdownload.macromedia.com/pub/flashplayer/installers/archive/fp_32.0.0.371_archive.zip)

如果你没法访问时光机，可以点击文末的链接使用网盘下载。我们这里选择Flash 32.0.0.371版本。

有了Flash还不够，还需要一个支持Flash的浏览器。我们这里选择`Ungoogled Chromium`（主要是因为它有CI Build存档，同时还提供了AppImage。我们选择Chromium最后一个带有PPAPI支持的版本`Chromium87`。

[下载页面](https://ungoogled-software.github.io/ungoogled-chromium-binaries/releases/appimage/64bit/87.0.4280.88-1.1)

[AppImage下载链接](https://github.com/mcstrugs/ungoogled-chromium-binaries/releases/download/87.0.4280.88-1.1/ungoogled-chromium_87.0.4280.88-1.1_linux.AppImage)

同样的，如果你没法访问Github，文末网盘链接里有所需的所有文件。

### 准备启动

下载后我们得到两个文件：
 - `fp_32.0.0.371_archive.zip` 这是Flash Player
 - `ungoogled-chromium_87.0.4280.141-1.1_linux.AppImage` 这是Chromium87

然后我们新建一个文件夹，把它们放进去。

```sh
❯ ll
Permissions Size User      Date Modified Name
.rw-r--r--  406M kirisauce  6 3月  13:27 fp_32.0.0.371_archive.zip
.rwxr-xr-x  123M kirisauce  5 3月  19:35 ungoogled-chromium_87.0.4280.141-1.1_linux.AppImage
```

然后解压出`fp_32.0.0.371_archive.zip`中的`32_0_r0_371/flashplayer32_0r0_371_linuxpep.x86_64.tar.gz`（如果你是32位就选带`i386`字样的，但一定要选带`linuxpep`字样的）。

然后新建一个文件夹（我这里是`pepperflash`），把`.tar.gz`包里的东西全解压进去。完成后be like：
```sh
❯ ll --tree
Permissions Size User      Date Modified Name
drwxr-xr-x     - kirisauce  6 3月  17:29 .
.rw-r--r--  406M kirisauce  6 3月  13:27 ├── fp_32.0.0.371_archive.zip
drwxr-xr-x     - kirisauce  6 3月  13:29 ├── pepperflash
drwxr-xr-x     - kirisauce  6 3月  13:29 │   ├── LGPL
.rw-r--r--  7.4k kirisauce 25 4月   2020 │   │   ├── LGPL.txt
.rw-r--r--    76 kirisauce 25 4月   2020 │   │   └── notice.txt
.rw-r--r--   20M kirisauce 25 4月   2020 │   ├── libpepflashplayer.so
.rw-r--r--  2.8M kirisauce 25 4月   2020 │   ├── license.pdf
.rw-r--r--  2.2k kirisauce 25 4月   2020 │   ├── manifest.json
.rw-r--r--  2.7k kirisauce 25 4月   2020 │   └── readme.txt
.rwxr-xr-x  123M kirisauce  5 3月  19:35 └── ungoogled-chromium_87.0.4280.141-1.1_linux.AppImage
```

### 启动

然后就可以启动浏览器了，这里需要用到三个参数：
 - `--no-sandbox` 旧版Chromium的sandbox实现似乎在我的系统上无法正常运行，因此需要禁用sandbox。这个参数视情况使用，禁用沙盒还是有点dangerous<heimu> 蛋 哥 热 死 </heimu>的。
 - `--ppapi-flash-path` 使用这个参数指定Flash插件路径，需要提供动态库文件的路径。
 - `--ppapi-flash-version` 使用这个参数告诉浏览器Flash的版本，似乎不是强制的。

最终启动命令大概长这样：
```sh
./ungoogled-chromium_87.0.4280.141-1.1_linux.AppImage --no-sandbox --ppapi-flash-path='./pepperflash/libpepflashplayer.so' --ppapi-flash-version='32.0.0.371'
```

这个版本的Chromium在每次启动时Flash都是默认禁用的。当你打开包含Flash内容的网站时会提示：
![flash-plugin-denied](./roco-kingdom/flash-plugin-denied.avif)

打开这个开关即可

![flash-plugin-chrome-settings](./roco-kingdom/flash-plugin-chrome-settings.avif)

打开开关后再回到游戏页面，左键一下Flash内容，就会跳出来一个提示，点击允许Flash启动。同时每次页面更新SWF文件时都会提示一次Flash已过期，点击允许一次即可。然后就启动！！！！！

![qd-and-play](./roco-kingdom/qd-and-play.avif "启动！！！！！")

## 个人截图

最后附上我的几张截图：

![my-1](./roco-kingdom/my-1.avif)
![my-2](./roco-kingdom/my-2.avif)
![my-3](./roco-kingdom/my-3.avif)
![my-4](./roco-kingdom/my-4.avif)
![my-5](./roco-kingdom/my-5.avif)
![my-6](./roco-kingdom/my-6.avif)
![my-7](./roco-kingdom/my-7.avif)
![my-8](./roco-kingdom/my-8.avif)
![my-9](./roco-kingdom/my-9.avif)

![my-10](./roco-kingdom/my-10.avif "你醒啦？菜都熟了，但没人会来偷你的菜了......")

![my-11](./roco-kingdom/my-11.avif "都是一次过，但是再也没有以前的新鲜感了")

![my-12](./roco-kingdom/my-12.avif "窗外的小家伙都晃了十几年了（")

End.

---------------------

[网盘链接](https://share.weiyun.com/AtQmMzbw) 密码：`drvuhn`