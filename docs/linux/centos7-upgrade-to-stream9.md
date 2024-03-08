---
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/algorithm-1.jpeg
tag:
  - 虚拟机
  - linux
---

# CentOS 7 升级至 CentOS Stream 9 操作教程

本操作教程仓库地址：[https://github.com/hyperter96/OhMyStream9](https://github.com/hyperter96/OhMyStream9)，所有Shell脚本在`scripts`目录下。

## CentOS 7 升级至 CentOS 8

:::details `cs7to8.sh`
```bash
#/bin/bash

# 安装EPEL Repository
yum install epel-release

# 安装 yum-utils tools
yum install yum-utils -y

# 安装rpmconf to resolve RPM packages
yum install rpmconf -y

rpmconf -a

# Perform a clean-up of all the packages you don’t require.
package-cleanup --leaves
package-cleanup --orphans

# 安装dnf (package manager) on CentOS 7
yum install dnf -y

# 删掉YUM package manager
dnf remove yum yum-metadata-parser
rm -rf /etc/yum

# Upgrade CentOS 7 to Centos 8
dnf upgrade -y
dnf install http://vault.centos.org/8.5.2111/BaseOS/x86_64/os/Packages/{centos-linux-repos-8-3.el8.noarch.rpm,centos-linux-release-8.5-1.2111.el8.noarch.rpm,centos-gpg-keys-8-3.el8.noarch.rpm}
dnf -y upgrade https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm
dnf clean all

# Remove the old CentOS 7 Kernel
rpm -e `rpm -qa kernel-ml`
rpm -e `rpm -qa kernel-lt`
rpm -e --nodeps sysvinit-tools
rpm -e --nodeps `rpm -qa gdbm`
dnf remove python36
dnf remove iprutils
dnf remove initscripts
dnf clean all
rm -rf /var/cache/dnf
dnf upgrade

#需要更新源
sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*
sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*
dnf install iprutils
rm -f /var/lib/rpm/__db*
db_verify /var/lib/rpm/Packages
rpm --rebuilddb
dnf install initscripts
dnf update


dnf -y --releasever=8 --allowerasing --setopt=deltarpm=false distro-sync

annobin=$(find /var/cache/dnf/ -name annobin-9.72-1.el8_5.2.x86_64*)
redhat_rpm_config=$(find /var/cache/dnf/ -name redhat-rpm-config-125-1.el8.noarch*)
mariadb=$(find /var/cache/dnf/ -name mariadb-connector-c-3.1.11-2.el8_3.x86_64*)

rpm -ivh --nodeps --force $annobin
rpm -ivh --nodeps --force $redhat_rpm_config
rpm -ivh --nodeps --force $mariadb

dnf -y --releasever=8 --allowerasing --setopt=deltarpm=false distro-sync

#  Install new kernel for CentOS 8
dnf -y install kernel-core

rmdir /etc/yum/pluginconf.d/ /etc/yum/protected.d/ /etc/yum/vars/

# Install CentOS 8 minimal packages
dnf -y groupupdate "Core" "Minimal Install"

sed -i 's/#PermitRootLogin yes/PermitRootLogin yes/g' /etc/ssh/sshd_config
```
:::

## CentOS 8 升级至 CentOS Stream 8

:::details `cs8upgrade2stream.sh`
```bash
#/bin/bash

# 切换到vault源
minorver=8.5.2111
sudo sed -e "s|^mirrorlist=|#mirrorlist=|g" \
         -e "s|^#baseurl=http://mirror.centos.org/\$contentdir/\$releasever|baseurl=https://mirrors.tuna.tsinghua.edu.cn/centos-vault/$minorver|g" \
         -i.bak \
         /etc/yum.repos.d/CentOS-*.repo

# 更新CentOS Stream 8
sudo dnf install \
    http://mirror.centos.org/centos/8-stream/BaseOS/x86_64/os/Packages/centos-stream-repos-8-4.el8.noarch.rpm \
    http://mirror.centos.org/centos/8-stream/BaseOS/x86_64/os/Packages/centos-stream-release-8.6-1.el8.noarch.rpm \
    http://mirror.centos.org/centos/8-stream/BaseOS/x86_64/os/Packages/centos-gpg-keys-8-4.el8.noarch.rpm \
    -y --allowerasing

sudo dnf distro-sync --allowerasing -y
```
:::

## CentOS Stream 8 升级至 CentOS Stream 9

### 准备RPMs

:::details `cs9rpmdownload.sh`
```bash
# /bin/sh

echo "Preparing to download RPMs"
echo "Setting up wget..."
sudo dnf install wget -y

echo "Creating directory ~/cs8to9/el9"
mkdir -p ~/cs8to9/el9
echo "Creating directory ~/cs8to9/epel9"
mkdir -p ~/cs8to9/epel9

echo "Downloading RPMs..."
cd ~/cs8to9/epel9
wget https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm
wget https://dl.fedoraproject.org/pub/epel/epel-next-release-latest-9.noarch.rpm

cd ~/cs8to9/el9
wget http://mirror.stream.centos.org/9-stream/BaseOS/x86_64/os/Packages/centos-stream-release-9.0-22.el9.noarch.rpm
wget http://mirror.stream.centos.org/9-stream/BaseOS/x86_64/os/Packages/centos-stream-repos-9.0-22.el9.noarch.rpm
wget http://mirror.stream.centos.org/9-stream/BaseOS/x86_64/os/Packages/centos-gpg-keys-9.0-22.el9.noarch.rpm
```
:::

### 移除非必要RPM包和旧内核

:::details `removekernel.sh`
```bash
# /bin/sh

echo "Removing old packages..."
sudo dnf autoremove -y

echo "Removing old kernels..."
echo "The following packages will be removed:"
rpm -q kernel && rpm -q kernel-devel && rpm -q kernel-core && rpm -q kernel-modules

read -p "Are you sure(y/N)? " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "yes"
    sudo rpm -e `rpm -q kernel` --nodeps
    sudo rpm -e `rpm -q kernel-devel` --nodeps
    sudo rpm -e `rpm -q kernel-core` --nodeps
    sudo rpm -e `rpm -q kernel-modules` --nodeps
fi
```
:::

### 升级 CentOS Stream 9

:::details `cs8to9.sh`
```bash
# /bin/sh

echo "Installing CentOS Stream 9 RPMs..."
cd ~/cs8to9/el9
sudo dnf install centos-stream-release-9.0-22.el9.noarch.rpm centos-stream-repos-9.0-22.el9.noarch.rpm centos-gpg-keys-9.0-22.el9.noarch.rpm -y

echo "Installing EPEL 9 RPMs..."
cd ~/cs8to9/epel9
sudo dnf install epel-release-latest-9.noarch.rpm epel-next-release-latest-9.noarch.rpm -y

echo "Upgrade to CentOS Stream 9..." 
sudo dnf distro-sync --allowerasing -y

echo "cat /etc/redhat-release"
cat /etc/redhat-release
```
:::

### 安装新内核

:::details `installkernel.sh`
```bash
# /bin/sh

echo "Rebuilding rpm database..."
sudo rpm --rebuilddb

echo "Reset dnf module cache..."
mkdir -p ~/cs8to9/empty && cd ~/cs8to9/empty
sudo dnf module reset * -y

echo "Installing new kernel..."
sudo dnf install kernel kernel-core kernel-devel kernel-modules -y
```
:::

### 重启系统

检查内核是否安装成功，如果安装成功，请重启系统。

:::warning 注意
重启之前请检查 `/etc/ssh/sshd_config`，查看下是否有
```bash
#PermitRootLogin prohibit-password
```
有的话改成
```bash
PermitRootLogin yes
```
然后保存。
:::

```bash
dnf list --installed | grep -i "kernel"

sudo reboot
```

重启后，检查内核版本

```bash
uname -a
```

内核版本应为`5.14`。

### 重建rescue镜像

你可以在`scripts`目录下找到`rebuildrescue.sh`，运行它，它会执行上述指令，自动重建rescue镜像。

:::details `rebuildrescue.sh`
```bash
# /bin/sh

echo "Rebuilding rescue image..."
sudo dnf reinstall dracut -y
mkdir -p ~/cs8to9/backup
sudo mv /boot/vmlinuz-0-rescue-* ~/cs8to9/backup
sudo mv /boot/initramfs-0-rescue-*.img ~/cs8to9/backup
sudo /usr/lib/kernel/install.d/51-dracut-rescue.install add $(uname -r) "" /lib/modules/$(uname -r)/vmlinuz
```
:::

### （可选）重新安装所有RPM包

```bash
cd ~/cs8to9/empty
sudo dnf reinstall -y *
```

享受你的新系统！