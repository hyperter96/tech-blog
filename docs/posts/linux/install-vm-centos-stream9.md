---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/algorithm-1.jpeg
date: 2024-02-07
tag:
  - 虚拟机
  - linux
---

# VMware安装CentOS Stream 9

## 下载Linux镜像

下载地址：[centos-stream-9-stream-BaseOS-x86_64-iso安装包下载_开源镜像站-阿里云 (aliyun.com)](https://mirrors.aliyun.com/centos-stream/9-stream/BaseOS/x86_64/iso/)

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/fb309797d1ab42268563d5d32c25eb9d.png)

## 创建新的虚拟机

也可以点击文件-->新建虚拟机

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/2888666811104568affffac0bc5bdaed.png)

## 自定义(高级)---->下一步

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/d4266981f6f14eb3b2b33df73507ba10.png)

## 直接“下一步”

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/4cd99167e1cb45fa81127ddcbcdd97d2.png)

## 稍后安装操作系统---->下一步

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/cd69faa3239244e795e5397c3dab3174.png)

## 选择客户机操作系统---->下一步

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/2a5373a8b67c4f608a1ec192305c290a.png)

:::warning 注意📢：
版本里没有 CentOS Stream 9 可供选择，用 Linux 5.x内核版本也行，CentOS Stream 9是基于Linux 5.x 内核的。
:::

## 命名虚拟机并指定位置---->下一步

这里虚拟机名称随便起，位置的话挑一个磁盘空间大一点的。自己得记得位置在哪

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/0005092061af492fa8f7714bde383585.png)

## 处理器配置 ---->下一步

根据自己的电脑性能来选择处理器数量和内核数量，不要超过物理机的处理器数量

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/f7e669df9fde4be0ba428172e84ad70b.png)

## 查看电脑处理器数量和内核数量方法：

1. 打开任务管理器---->性能---->打开资源监视器

    快捷键：Ctrl + Alt + Del

    ![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/a0c6bde874fa42209fe191450816b89b.png)

2. 查看处理器数量和内核数量

    ![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/16057b1ea2d74466bc13fa69435b0b39.png)

    此电脑处理器数量：2，内核数量：8

## 指定分配给此虚拟机的内存量---->下一步

根据自己电脑的内存量分配

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/48d35ebb5316454bbe8acc2a8c96f25f.png)

## 网络类型 ---->下一步

使用NAT模式

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/74a2ef4c92fb4a23891b82b5ff9a00c8.png)

## 选择 I/O 控制器类型---->下一步

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/9d594a56469d4f2a896c526720f2a69f.png)

## 选择磁盘类型---->下一步

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/6519b9a5a7734a0691ded5cab3687e1e.png)

## 选择磁盘---->下一步

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/8cf0bb07132743d89c7cc812b62b7e96.png)

## 指定磁盘容量---->下一步

根据自己电脑内存进行分配，一般不用太大，同时我选择了将虚拟磁盘存储为单个文件，这样性能更高

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/1ece184fbd0741efb2d4b5d75f1eee65.png)

## 直接“下一步”

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/27bbd2806f5d4169b1231f5238383c74.png)

## 自定义硬件

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/75c5933fa41240c28ee8831d962f8697.png)

选择自己的系统镜像文件（下载的CentOS Stream 9）

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/3cd46bd964664819b8e1c99691d90d50.png)

移除打印机---->关闭 

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/e19cdd976e4641c29866aca0c0d0e5e5.png)

## 点击“完成”

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/970a5ed5e639426288d8776bbc67ea34.png)

## 开启此虚拟机

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/61662228d66049e2b3580994751f2a4d.png)

## 安装CentOS Stream 9

方向键选择`Install CentOS Stream 9`，回车确认

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/84a1baac90ee49df99390e72a9bb41de.png)

## 选择语言---->继续

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/838ab47c6b9544989fa9bd5a60d1aafc.png)

## 安装目的地

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/fe7bafeb9f0544df82e572e2d5421e9e.png)

## 选择存储配置---->完成

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/ad42dee3c86e48e48fe284bf26664a0b.png)

## 手动分区

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/4a4ed755ee8346818d8e63687d2656cf.png)

## 完成分区

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/33f9248f537d4f0b9180a4089996eabc.png)

点击接受更改

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/665ffe849fb64fb6a2a3a7e055a5ace8.png)

## 设置ROOT密码

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/7b09b4680d2e446996fdae0e2165c076.png)

取消勾选锁定root账户，锁定的用户不能登录

勾选允许root用户使用密码进行 SSH 登录，让root用户可以远程登录 

:::warning 注意📢：
出于安全性考虑，一般禁用root账户登录，使用创建的用户登录。所以也可以两个都勾选。
:::

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/bff67281cd624be1b552670661cf6c8e.png)

:::warning 注意📢：
密码太短需要按两次完成。
:::

## 创建用户

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/af13c61ba99e4ec18048c801365d3f94.png)

名字随便起，密码太短需要按两次完成

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/348e99671d394a1991e0db2ed8068fd3.png)

## 软件选择

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/6092d48c87da44659d99674cfe4826a3.png)

选择Minimal Install。

## 禁用KDUMP

:::warning 注意📢：
kdump是在系统崩溃、死锁或者死机的时候用来转储内存运行参数的一个工具和服务，不需要分析内核崩溃原因的话，不用开启，需要的时候再开启也可以。
:::

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/804abb241f914c9ea71e7d76814ba07a.png)

取消勾选KDUMP

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/a9f13372f5d440d6a130dc10ac02bd49.png)

## 网络和主机名

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/b403e9e889a344db96d39693b2ba94e4.png)

打开以太网，

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/41e84a91eac04531a230224448a66f35.png)

## 开始安装 

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/a338b8093db74d5c9b53d44fec330805.png)

:::warning 注意📢：
安装过程比较慢，请耐心稍等 
:::

等待安装完毕，安装完毕后点击重启系统

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/6b5b37cc04ee493086dde3cb18efe13f.png)

重启系统后登录即可使用！

