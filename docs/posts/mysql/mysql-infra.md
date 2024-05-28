---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/mysql-cover.jpg
date: 2024-05-03
sticky: 1
tags: 
  - kubernetes
  - MySQL
---

# MySQL知识系列一：MySQL架构图

Mysql服务端架构分为Server层和存储引擎层（可插拔式），Server层主要包含了连接器、缓存模块、分析器、优化器、执行器；可插拔的存储引擎主要有InnoDB、MyISAM、Memory。当一个请求进入后的执行流程如下图的箭头所示：

[](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/mysql-infra.png)



