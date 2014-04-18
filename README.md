Cell Cloud for JavaScript
=========================


Cell Cloud 是面向云计算应用系统开发者的云计算引擎，Cell Cloud 允许您创建自己的私有云，定义自己的云计算服务，通过丰富的软件栈让应用系统构建起“云计算”能力。

Cell Cloud 软件栈支持 C/C++、Java、Object-C、C#、JavaScript（HTML4/5）、ActionScript 等主流语言，支持的平台包括：Windows Server 2008/2012、Windows Vista/7/8、Ubuntu 12+、Mac OS X 10.x、iOS 6+/7+、Android 2.3+/4.0+、Flash 10+、AIR 13+ 等。


特性
----

- 经过充分优化的 Low-level 和 High-level API
- 完备的分布式特性支持，包括数据均衡、负载均衡、数据分片、故障检测、集群发现等
- 分层架构，插件式服务管理，支持服务热拔插
- 服务节点及角色自定义
- 支持异构计算


简介
----
Cell Cloud 的整体结构设计中，将内核和容器分开设计，无论你使用什么语言进行开发，一般的，含有“ **nucleus** ”标识的即为内核，含有“ **cell** ”标识的即为容器。容器内的内核是唯一的，也就是说一个运行时容器内只会有一个内核在运行。内核完成最基本的调度，以提供你所需要的所有计算特性，在此基础之上你可以按照你的设计编写云计算环境里的分布式应用，这就是 Cell Cloud 为你提供的开发栈。

你需要事先了解的一些 Cell Cloud 的设计有：

+ **Cellet** 是 Cell Cloud 里的基本服务单元，也是内核管理的最小运算单元。一个 Cellet 可以完成单一服务也可以完成多个服务，这由您的设计决定。每个 Cellet 都可以进行独立通信。
+ 在物理结构上，每个独立的进程就是一个 Cell Cloud 的 **cell** 容器。每个容器里可以包括 1 到 N 个服务单元，即每个容器内可容纳多个 Cellet 。
+ 每个容器里的内核可以按照部署需要工作在不同的角色层次：计算节点、存储节点、负载网关、数据客户端。不同的角色层次内核会进行不同的自动优化。当然，内核可以同时被设置为多个角色，或者你自定义角色。
+ 内核之间的通信被统一称为 **TALK** 会话。会话使用 **Primitive** 数据结构，每个 Cellet 都是一个独立的会话终端，因此 Cellet 是天然的通信节点。
+ 根据开发需要，你需要选取不同的技术组件，例如，当你需要充分挖掘你的服务器大内存潜力时，你可以选择 Big Memory + Cluster Chunk 组件；当你需要在终端间高效传输文件数据时，你可以选择 File Express 组件等等。


示例
----

### 创建 Cellet 

TODO

### 获取 Cellet 服务

TODO
