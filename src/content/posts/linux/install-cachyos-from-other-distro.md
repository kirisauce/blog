---
title: 从Manjaro共存安装CachyOS
pubDate: 2026-05-13
updateDate: 2026-05-13
tags: [Linux]
---

前几天看到Steam系统调查里CachyOS居然占了8%，Manjaro只有可怜的1.5%，于是一时兴起，想尝试一下。
但是有不想完全卸载Manjaro，于是开始研究怎么直接在现有的系统上安装cachyos，就有了这篇。

## 弯路

 - 尝试使用Manjaro的pacman，但是manjaro的pacman不认识cachyos特有的arch（x86_64_v3）导致安装失败

## 准备

### 需要用到的软件

 - `fuseiso` 用来挂载安装镜像
 - `squashfuse` 用来挂载安装镜像里的squashfs压缩文件系统
 - `systemd-nspawn` 用来启动livecd容器（其实并非启动）
 - `arch-install-scripts` arch-chroot脚本

最后还需要一个[CachyOS的安装镜像](https://cachyos.org/download/)，直接从官网下载即可。

### 准备文件系统

我使用的是btrfs，所以多个Linux发行版共存非常简单，只需使用btrfs提供的SubVolume功能隔离即可。

参考Manjaro的布局，创建以下子卷：

| Path | Description | 挂载点 |
| --- | --- | --- |
| @cachyos | CachyOS的root文件系统 | / |
| @cachyos/cache | 缓存 | /var/cache |
| @cachyos/log | 日志 | /var/log |
| @cachyos/home | 用户数据 | /home |

Manjaro的root文件系统子卷是`/@`，但是创建子卷需要在`/`下操作，所以需要先挂载的btrfs真正的root：

```bash
# 创建一个目录用来挂载
sudo mkdir /mnt/fsroot
# 这里开始需要把 /dev/nvme0n1p2 改为你自己的分区设备
# 可以使用 df 命令查看，挂载点为 / 的那个设备就是
sudo mount /dev/nvme0n1p2 /mnt/fsroot
```

创建子卷：

```bash
sudo btrfs subvolume create /mnt/fsroot/@cachyos
sudo btrfs subvolume create /mnt/fsroot/@cachyos/cache
sudo btrfs subvolume create /mnt/fsroot/@cachyos/log
sudo btrfs subvolume create /mnt/fsroot/@cachyos/home
```

创建完毕，卸载掉btrfs的root：

```bash
sudo umount /mnt/fsroot
```

然后把新的子卷挂载上来，并cd进去，为等一下装系统做准备：

```bash
sudo mount -o subvol=@cachyos /dev/nvme0n1p2 /mnt/fsroot
cd /mnt/fsroot
```

创建目录并挂载：

```bash
sudo mkdir -p var/log var/cache home boot/efi
sudo mount -o subvol=/@cachyos/log /dev/nvme0n1p2 var/log
sudo mount -o subvol=/@cachyos/cache /dev/nvme0n1p2 var/cache
sudo mount -o subvol=/@cachyos/home /dev/nvme0n1p2 home
# 将/dev/nvme0n1p1替换为你的EFI分区设备
sudo mount /dev/nvme0n1p1 boot/efi
```

## 安装系统

### 准备容器

首先挂载安装镜像：

（提一嘴：虽然fuseiso本身不需要root，但是我们还是放在root下，因为不使用root挂载会导致后面systemd-nspawn容器无法读取。之后的squashfuse同理。）

（从这里开始有大量sudo，建议直接切换到root用户下执行（前提是你要确保你知道自己在干什么，否则我还是建议你老老实实sudo））

```bash
sudo mkdir /tmp/cachyiso
sudo fuseiso /path/to/cachyos.iso 
```

如果挂载成功，你应该可以在里面找到一个`*.sfs`文件，这个就是压缩过后的livecd镜像。

```bash
> sudo fd '\.sfs$' /tmp/cachyiso
/tmp/cachyiso/arch/x86_64/airootfs.sfs
```

接下来使用`squashfuse`挂载它：

```bash
sudo mkdir /tmp/cachylive
sudo squashfuse /tmp/cachyiso/arch/x86_64/airootfs.sfs /tmp/cachylive

# sudo ls /tmp/cachylive
# 能看到一个正常的rootfs结构就算成功了
# 示例：usr bin dev etc lib lib64 media mnt opt root run sbin sys var
```

接下来我们需要创建一个pacman配置文件，直接放在root用户够得到的地方即可，基础配置从`/tmp/cachylive/etc/pacman.conf`复制过来，然后稍作改动：

```diff
--- a/tmp/cachylive/etc/pacman.conf
+++ b/pacman.conf
@@ -13,7 +13,7 @@
 #DBPath      = /var/lib/pacman/
 #CacheDir    = /var/cache/pacman/pkg/
 #LogFile     = /var/log/pacman.log
-#GPGDir      = /etc/pacman.d/gnupg/
+GPGDir      = /mnt/etc/pacman.d/gnupg/
 #HookDir     = /etc/pacman.d/hooks/
 HoldPkg     = pacman glibc
 #XferCommand = /usr/bin/curl -L -C - -f -o %o %u
 
@@ -72,7 +73,22 @@ LocalFileSigLevel = Optional
 
 [cachyos]
 SigLevel = Optional TrustAll
-Include = /etc/pacman.d/cachyos-mirrorlist
+Server = https://mirrors.ustc.edu.cn/cachyos/repo/$arch/$repo
+
+[cachyos-v3]
+Server = https://mirrors.ustc.edu.cn/cachyos/repo/$arch_v3/$repo
+
+[cachyos-core-v3]
+Server = https://mirrors.ustc.edu.cn/cachyos/repo/$arch_v3/$repo
+
+[cachyos-extra-v3]
+Server = https://mirrors.ustc.edu.cn/cachyos/repo/$arch_v3/$repo
 
 # The testing repositories are disabled by default. To enable, uncomment the
 # repo name header and Include lines. You can add preferred servers immediately
```

解释一下两处改动：
1. `GPGDir` 用来配置pacman的gpg数据目录，由于我们使用的是容器和squashfuse，因此`/etc/pacman.d`并不像真实的livecd里一样可以修改。这里把它配置到新系统的目录下确保不会报错。
2. 这里配置的是中科大的镜像以及`x86_64_v3`优化的仓库，如果你是`x86_64_v4`兼容的设备，可以把所有v3改为v4。

这里的配置文件是临时给`pacstrap`用的，因此不会保存到新系统。

### 容器 启动！

把下面的`/root/pacman.conf`替换为上一步创建的文件路径，然后启动!容器：

```bash
sudo systemd-nspawn \
    -D /tmp/cachylive \
    --bind /mnt/fsroot:/mnt \
    --bind-ro /etc/resolv.conf \
    --bind-ro /root/pacman.conf:/etc/pacman.conf \
    /usr/bin/bash
```

进入容器后，接下来的流程就很接近正常arch的安装流程了

也可以把`neovim`换成你顺手的文本编辑器

```bash
pacstrap -K /mnt base base-devel cachyos-keyring archlinux-keyring cachyos-mirrorlist cachyos-v3-mirrorlist cachyos-v4-mirrorlist neovim
genfstab -U /mnt >> /mnt/etc/fstab

arch-chroot /mnt
useradd -G wheel myuser
passwd myuser
passwd root
# 去掉%wheel开头的行以允许sudo
nvim /etc/sudoers
```

这里直接退回到宿主机使用`arch-chroot`进去安装好的rootfs。

```bash
arch-chroot /mnt/fsroot
```

tip: 按两下`Ctrl+]`接`p`即可发送关机指令，按三下`Ctrl+]`可强制Kill容器。

修改pacman配置文件 `/etc/pacman.conf`，增加下面几行（根据情况选择是否替换v3为v4）

```ini 
[cachyos]
Server = https://mirrors.ustc.edu.cn/cachyos/repo/$arch/$repo

[cachyos-v3]
Server = https://mirrors.ustc.edu.cn/cachyos/repo/$arch_v3/$repo

[cachyos-core-v3]
Server = https://mirrors.ustc.edu.cn/cachyos/repo/$arch_v3/$repo

[cachyos-extra-v3]
Server = https://mirrors.ustc.edu.cn/cachyos/repo/$arch_v3/$repo
```

（省略中间配置主机名、多用户、locale、时区等步骤）

安装paru, kernel和grub

```bash
sudo pacman -S paru
paru -S cachyos-grub-theme grub-hook grub-btrfs-support grub efibootmgr linux-firmware
paru -S intel-ucode # 或者如果你是amd就用amd-ucode
paru -S linux-cachyos
# 或者linux-cachyos-bore，不确定就不用改
```

打开`/etc/default/grub`，作以下更改：

```diff
-- GRUB_DISTRIBUTOR="Arch"
++ GRUB_DISTRIBUTOR="CachyOS"

-- #GRUB_THEME="/path/to/gfxtheme"
++ GRUB_THEME="/usr/share/grub/themes/cachyos/theme.txt"

-- #GRUB_DISABLE_OS_PROBER=false
++ GRUB_DISABLE_OS_PROBER=false
```

安装grub：

```bash
grub-install --efi-directory=/boot/efi --boot-directory=/boot
```

安装KDE（或者你喜欢的其他DE/WM）（或者不装也可以）

```bash
paru -S kitty
paru -S plasma
```

差不多安装完了，可以重启了。重启之后进入系统就可以安装你想要的其他软件了。不过别忘了安装`cachyos`包哦。

虽然本篇是安装CachyOS的记录，但是理论上也适用于其他Arch系的发行版。