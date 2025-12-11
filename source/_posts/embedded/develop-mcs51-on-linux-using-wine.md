---
title: 通过wine在linux上开发51单片机
date: 2025-12-10 23:21:51
tags: [linux,嵌入式,wine]
---

## 背景
最近报名了[蓝桥杯]的单片机赛，单片机使用的是[宏晶]出产的`IAP15F2K61S2`单片机。众所周知，开发8051单片机的常用组合是[Keil]+STC-ISP，这两个东西仅支持Windows。但是我的主力系统是`Manjaro Linux`，所以需要通过`wine`使用这两个玩意。

（为什么不用SDCC+stcgal？因为蓝桥杯必须用[Keil]+STC-ISP）

{% heimu （作为一家国产芯片厂商却没有官方支持linux是何意味😠😠😠） %}

## 安装Keil
非常简单，只需要双击安装包一路Next就完事了。

## 安装STC-ISP
非常简单，从[STC官网](https://www.stcmicro.com.cn/rjxz.html?i=1)下载可执行文件就行了~~然后就非常顺利得到了报错~~。

```sh
❯ wine STC-ISP-v6.96.exe
00f4:err:environ:init_peb starting L"D:\\STC-ISP-v6.96.exe" in experimental wow64 mode
00f4:err:module:import_dll Library MFC42.DLL (which is needed by L"D:\\STC-ISP-v6.96.exe") not found
00f4:err:module:loader_init Importing dlls for L"D:\\STC-ISP-v6.96.exe" failed, status c0000135
```

~~一开始我是通过Steam的proton启动，缺了库也没有报错信息看。~~

报错信息非常直观。STC-ISP是32位可执行文件，这时候只要从已安装的Windows系统里复制`C:\Windows\SysWOW64\mfc42.dll`过来放在Wine的`C:\windows\SysWOW64`文件夹下面，或者通过`winetricks`下载对应的动态库就好了。

{% heimu --title 何意味 冷知识：64位Windows里System32存的是64位库，SysWOW64里存的是32位库。巨硬牌石山这块（ %}

## ~~不~~常见问题

### 找不到串口

wine可以把Linux的串口映射为windows的串口，所以如果你找不到设备可以手动创建一个链接：
```sh
# 取消原来的符号链接
unlink ~/.wine/dosdevices/com1

# 链接到正确的串口上
ln -s /dev/ttyUSB0 ~/.wine/dosdevices/com1
```

~~如果linux也识别不到串口那就没办法了捏~~

完

[蓝桥杯]: https://lanqiao.cn/
[宏晶]: https://www.stcmicro.com.cn/
[Keil]: https://keil.com/