---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/velero-cover.png
date: 2024-01-05
tag:
  - Velero
  - 备份恢复
  - kubernetes
sticky: 1
---

# 利用Velero对K8S备份还原与集群迁移实战

## 简介

Velero 是一款云原生时代的灾难恢复和迁移工具，采用 Go 语言编写，并在 github 上进行了开源，利用 velero 用户可以安全的备份、恢复和迁移 Kubernetes 集群资源和持久卷。

- 开源地址：[https://github.com/vmware-tanzu/velero](https://github.com/vmware-tanzu/velero)
- 官方文档：[https://velero.io/docs/main/](https://velero.io/docs/main/)

### Velero组件

Velero 组件一共分两部分，分别是服务端和客户端。

- 服务端：运行在你 Kubernetes 的集群中
- 客户端：是一些运行在本地的命令行的工具，需要已配置好 `kubectl` 及集群 kubeconfig 的机器上

### Velero备份流程

- velero客户端调用kubernetes API Server创建backup任务
- Backup控制器基于watch机制通过Api Server获取到备份任务
- Backup控制器开始执行备份动作，会通过请求Api Server获取到需要备份的数据
- Backup 控制器将获取到的数据备份到指定的对象存储server端

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/velero-workflow.png)

### Velero后端存储
Velero支持两种关于后端存储的CRD，分别是`BackupStorageLocation`和`VolumeSnapshotLocation`。

#### BackupStorageLocation

主要用来定义 Kubernetes 集群资源的数据存放位置，也就是集群对象数据，不是 PVC 的数据。主要支持的后端存储是 S3 兼容的存储，比如：Mino 和阿里云 OSS 等。

#### VolumeSnapshotLocation

主要用来给 PV 做快照，需要云提供商提供插件。阿里云已经提供了插件，这个需要使用 CSI 等存储机制。你也可以使用专门的备份工具 Restic，把 PV 数据备份到阿里云 OSS 中去(安装时需要自定义选项)。

Restic 是一款 GO 语言开发的数据加密备份工具，顾名思义，可以将本地数据加密后传输到指定的仓库。支持的仓库有 Local、SFTP、Aws S3、Minio、OpenStack Swift、Backblaze B2、Azure BS、Google Cloud storage、Rest Server。

## 准备存储插件

Velero支持很多种存储插件，可查看：[https://velero.io/docs/main/supported-providers/](https://velero.io/docs/main/supported-providers/) 获取插件信息，我们这里使用minio作为S3兼容的对象存储提供程序。您也可以在任意地方部署Minio对象存储，只需要保证K8S集群可以访问到即可。

### 准备minio清单

:::details `minio.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: velero
  labels:
    app: minio
spec:
  selector:
    app: minio
  ports:
  - name: api
    port: 9000
    protocol: TCP
  - name: console
    port: 9001
    protocol: TCP
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: minio
  namespace: velero
  labels:
    app: minio
spec:
  replicas: 1
  serviceName: minio
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: docker.io/bitnami/minio:2023.3.22
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 9000
          name: api
          protocol: TCP
        - containerPort: 9001
          name: console
          protocol: TCP
        env:
        - name: MINIO_ROOT_USER
          value: "minio"
        - name: MINIO_ROOT_PASSWORD
          value: "minio123"
        - name: MINIO_DEFAULT_BUCKETS
          value: "velero"
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ "ReadWriteOnce" ]
        resources:
          requests:
            storage: 50Gi
```
:::

### 创建minio应用

```bash
# 创建velero命名空间
$ kubectl create namespace velero
# 创建minio资源
$ kubectl apply -f minio.yaml
 
# 查看部署状态
$ kubectl get sts,pod,svc -n velero
NAME                     READY   AGE
statefulset.apps/minio   1/1     66s
 
NAME          READY   STATUS    RESTARTS   AGE
pod/minio-0   1/1     Running   0          65s
 
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)             AGE
service/minio   ClusterIP   10.99.223.162   <none>        9000/TCP,9001/TCP   66s

# 开放NodePort端口
$ kubectl patch svc minio -n velero -p '{"spec": {"type": "NodePort"}}'
$ kubectl patch svc minio -n velero --type='json' -p='[{"op": "replace", "path": "/spec/ports/0/nodePort", "value":9000},{"op": "replace", "path": "/spec/ports/1/nodePort", "value":9001}]'
 
$ kubectl get svc -n velero
NAME    TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)                       AGE
minio   NodePort   10.99.223.162   <none>        9000:9000/TCP,9001:9001/TCP   140m
```

通过浏览器访问服务器`IP:9001`，并使用账号`minio`密码`minio123`登入验证。

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/velero-practice-1.png)

## 安装velero

版本列表：[https://github.com/vmware-tanzu/velero/releases](https://github.com/vmware-tanzu/velero/releases)

### 安装velero命令程序

```bash
$ wget https://github.com/vmware-tanzu/velero/releases/download/v1.13.0/velero-v1.13.0-linux-amd64.tar.gz
$ tar zxf velero-v1.13.0-linux-amd64.tar.gz 
$ mv velero-v1.13.0-linux-amd64/velero /usr/bin/
$ velero -h
# 启用命令补全
$ source <(velero completion bash)
$ velero completion bash > /etc/bash_completion.d/velero
```
### 创建密钥

```bash
$ cat > credentials-velero <<EOF
[default]
aws_access_key_id = minio
aws_secret_access_key = minio123
EOF
```
### 安装velero到k8s集群

```bash
$ velero install \
  --provider aws \
  --image velero/velero:v1.13.0 \
  --plugins velero/velero-plugin-for-aws:v1.6.0 \
  --bucket velero \
  --secret-file ./credentials-velero \
  --use-node-agent \
  --use-volume-snapshots=false \
  --namespace velero \
  --backup-location-config region=minio,s3ForcePathStyle="true",s3Url=http://minio:9000 \
  --wait
# 执行install命令后会创建一系列清单，包括CustomResourceDefinition、Namespace、Deployment等。
 
# 可使用如下命令查看运行日志
$ kubectl logs deployment/velero -n velero
 
# 查看velero创建的api对象
$ kubectl api-versions | grep velero
velero.io/v1
 
# 查看备份位置
$ velero backup-location get
NAME      PROVIDER   BUCKET/PREFIX   PHASE       LAST VALIDATED                  ACCESS MODE   DEFAULT
default   aws        velero          Available   2023-03-28 15:45:30 +0800 CST   ReadWrite     true
```

选项说明：

- `--kubeconfig`(可选)：指定kubeconfig认证文件，默认使用`.kube/config`；
- `--provider`：定义插件提供方；
- `--image`：定义运行velero的镜像，默认与velero客户端一致；
- `--plugins`：指定使用aws s3兼容的插件镜像；
- `--bucket`：指定对象存储Bucket桶名称；
- `--secret-file`：指定对象存储认证文件；
- `--use-node-agent`：创建Velero Node Agent守护进程，托管FSB模块；
- `--use-volume-snapshots`：是否启使用快照；
- `--namespace`：指定部署的`namespace`名称，默认为velero；
- `--backup-location-config`：指定对象存储地址信息；

### 卸载velero

如果您想从集群中完全卸载Velero，则以下命令将删除由`velero install`创建的所有资源:

```bash
kubectl delete namespace/velero clusterrolebinding/velero
kubectl delete crds -l component=velero
```

## 备份与恢复

备份命令：`velero create backup NAME [flags]`

backup选项：

- `--exclude-namespaces`: 要从备份中排除的名称空间
- `--exclude-resources`: 要从备份中排除的资源，如`storageclasses.storage.k8s.io`
- `--include-cluster-resources` optionalBool[=true]: 包含集群资源类型
- `--include-namespaces`: 要包含在备份中的名称空间(默认'*')
- `--include-resources`: 备份中要包括的资源
- `--labels`: 给这个备份加上标签
- `-o, --output`: 指定输出格式，支持`'table'`、`'json'`和`'yaml'`；
- `-l, --selector`: 对指定标签的资源进行备份
- `--snapshot-volumes` optionalBool[=true]: 对 PV 创建快照
- `--storage-location`: 指定备份的位置
- `--ttl`: 备份数据多久删掉
- `--volume-snapshot-locations`: 指定快照的位置，也就是哪一个公有云驱动

### 备份

#### 使用官方案例创建测试应用
```bash
$ kubectl apply -f examples/nginx-app/base.yaml 
namespace/nginx-example created
deployment.apps/nginx-deployment created
service/my-nginx created
 
# 查看资源清单
$ kubectl get all -n nginx-example
NAME                                   READY   STATUS    RESTARTS   AGE
pod/nginx-deployment-57d5dcb68-g42mk   1/1     Running   0          41s
pod/nginx-deployment-57d5dcb68-pcc6t   1/1     Running   0          41s
 
NAME               TYPE           CLUSTER-IP   EXTERNAL-IP   PORT(S)        AGE
service/my-nginx   LoadBalancer   10.96.0.31   <pending>     80:27370/TCP   41s
 
NAME                               READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nginx-deployment   2/2     2            2           41s
 
NAME                                         DESIRED   CURRENT   READY   AGE
replicaset.apps/nginx-deployment-57d5dcb68   2         2         2       41s
```

#### 备份测试应用

```bash
$ velero backup create nginx-backup --include-namespaces nginx-example
Backup request "nginx-backup" submitted successfully.
Run `velero backup describe nginx-backup` or `velero backup logs nginx-backup` for more details.
```

选项：

- `--include-namespaces`：指定命名空间
- `--selector`：标签选择器，如`app=nginx`

#### 查看备份列表

```bash
$ velero backup get
NAME           STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES   STORAGE LOCATION   SELECTOR
nginx-backup   Completed   0        0          2023-03-09 09:38:50 +0800 CST   29d       default            <none>
 
# 查看备份详细信息
$ velero backup describe nginx-backup
 
# 查看备份日志
$ velero backup logs nginx-backup
```

登入minio控制台查看备份内容

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/velero-practice-2.png)

#### 定时备份指南

```bash
# 使用cron表达式备份
$ velero schedule create nginx-daily --schedule="0 1 * * *" --include-namespaces nginx-example
 
# 使用一些非标准的速记 cron 表达式
$ velero schedule create nginx-daily --schedule="@daily" --include-namespaces nginx-example
 
# 手动触发定时任务
$ velero backup create --from-schedule nginx-daily
```

### 恢复

####  模拟灾难

```bash
# 删除nginx-example命名空间和资源
$ kubectl delete namespace nginx-example
# 检查是否删除
$ kubectl get all -n nginx-example
No resources found in nginx-example namespace.
```
#### 恢复资源
```bash
$ velero backup get
NAME           STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES   STORAGE LOCATION   SELECTOR
nginx-backup   Completed   0        0          2023-03-09 09:38:50 +0800 CST   29d       default            <none>
$ velero restore create --from-backup nginx-backup
Restore request "nginx-backup-20230309095025" submitted successfully.
Run `velero restore describe nginx-backup-20230309095025` or `velero restore logs nginx-backup-20230309095025` for more details.
```

#### 检查恢复的资源

```bash
$ velero restore get
NAME                          BACKUP         STATUS      STARTED                         COMPLETED                       ERRORS   WARNINGS   CREATED                         SELECTOR
nginx-backup-20230309095025   nginx-backup   Completed   2023-03-09 09:50:25 +0800 CST   2023-03-09 09:50:25 +0800 CST   0        1          2023-03-09 09:50:25 +0800 CST   <none>
 
# 查看详细信息
$ velero restore describe nginx-backup-20230309095025
 
# 检查资源状态
$ kubectl get all -n nginx-example
NAME                                   READY   STATUS    RESTARTS   AGE
pod/nginx-deployment-57d5dcb68-g42mk   1/1     Running   0          2m19s
pod/nginx-deployment-57d5dcb68-pcc6t   1/1     Running   0          2m19s
 
NAME               TYPE           CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
service/my-nginx   LoadBalancer   10.96.0.204   <pending>     80:31291/TCP   2m19s
 
NAME                               READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nginx-deployment   2/2     2            2           2m19s
 
NAME                                         DESIRED   CURRENT   READY   AGE
replicaset.apps/nginx-deployment-57d5dcb68   2         2         2       2m19s
```

## 项目迁移实战

### 项目介绍

我们将使用Velero快速完成云原生应用及PV数据的迁移实践过程，在本文示例中，我们将A集群中的一个MOS应用迁移到集群B中，其中数据备份采用自建Minio对象存储服务。

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/velero-practice-3.png)

#### 环境要求

- 迁移项目最好保证两个Kubernetes集群版本一致。
- 为了保证PV数据成功迁移，两边需要安装好相同名字的StorageClass。
- 可以自己部署Minio，也可以使用公有云的对象存储服务，如华为的OBS、阿里的OSS等。
- 本案例将集群A中`app-system`命名空间中的服务及PV数据迁移到集群B中。

#### 项目环境

|角色     |	集群IP       |	集群版本  |	部署软件 |
|---------|--------------|----------|------------------------------|
|K8S 集群A|	192.168.1.102|	v1.22.10|	`openebs、velero、app-system`|
|K8S 集群B|	192.168.1.103|	v1.22.10|	`openebs、velero、minio`     |

#### 项目说明

我们需要将集群A中 `app-system` 空间的所有资源和数据全部迁移到集群B中，该项目包括了`deployment、statefulset、service、ingress、job、cronjob、secret、configmap、pv、pvc`。

```bash
# 项目清单信息
$ kubectl get deployment,sts,pvc -n app-system
NAME                                READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/hasura-graphql      1/1     1            1           5h27m
deployment.apps/iot-backend         1/1     1            1           5h27m
deployment.apps/iot-gateway         1/1     1            1           5h27m
deployment.apps/iot-history         1/1     1            1           5h27m
deployment.apps/iot-observer        1/1     1            1           5h27m
deployment.apps/app-backend         1/1     1            1           5h27m
deployment.apps/app-frontend        1/1     1            1           5h27m
 
NAME                                READY   AGE
statefulset.apps/minio              1/1     5h27m
statefulset.apps/mongo              1/1     5h27m
statefulset.apps/postgres           1/1     5h27m
statefulset.apps/rabbitmq           1/1     5h27m
statefulset.apps/redis              1/1     5h27m
 
NAME                                       STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS       AGE
persistentvolumeclaim/data-minio-0         Bound    pvc-950d15a8-20a5-4e5f-8dbf-b904295355bb   50Gi       RWO            openebs-hostpath   5h27m
persistentvolumeclaim/data-mongo-0         Bound    pvc-e435b80e-0370-4100-b223-ca841f24bd5d   50Gi       RWO            openebs-hostpath   5h27m
persistentvolumeclaim/data-postgres-0      Bound    pvc-359ec32a-4bfc-4bc8-8cf3-38322e8ef59b   300Gi      RWO            openebs-hostpath   5h27m
persistentvolumeclaim/data-redis-0         Bound    pvc-da718e0c-992c-4f6e-af44-abb1c7214a9e   2Gi        RWO            openebs-hostpath   5h27m
persistentvolumeclaim/app-backend          Bound    pvc-506261a9-6be4-4d95-8807-58201e31a527   10Gi       RWO            openebs-hostpath   5h27m
```

### 准备对象存储

按照2.1和2.2的方法在集群B（`192.168.1.103`）中创建minio应用，用来存放备份数据。

```bash
$ kubectl get sts,svc -n velero
NAME                     READY   AGE
statefulset.apps/minio   1/1     3h44m
 
NAME            TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)                       AGE
service/minio   NodePort   10.99.223.162   <none>        9000:9000/TCP,9001:9001/TCP   3h44m
```

### 安装velero

请确保在集群A和集群B中已经安装好velero客户端，请参考[安装velero命令程序](./intro-and-practice.md#安装velero)

#### 在集群A中安装velero服务
```bash
$ cat > credentials-velero <<EOF
[default]
aws_access_key_id = minio
aws_secret_access_key = minio123
EOF
 
$ velero install \
  --provider aws \
  --image velero/velero:v1.13.0 \
  --plugins velero/velero-plugin-for-aws:v1.6.0 \
  --bucket velero \
  --secret-file ./credentials-velero \
  --use-node-agent \
  --use-volume-snapshots=false \
  --namespace velero \
  --backup-location-config region=minio,s3ForcePathStyle="true",s3Url=http://192.168.1.103:9000 \
  --wait
```
:::warning 注意📢：
其中S3的地址指向集群B（`192.168.1.103`）的minio对象存储。
:::

#### 在集群B种安装velero服务

```bash
$ cat > credentials-velero <<EOF
[default]
aws_access_key_id = minio
aws_secret_access_key = minio123
EOF
 
$ velero install \
  --provider aws \
  --image velero/velero:v1.13.0 \
  --plugins velero/velero-plugin-for-aws:v1.6.0 \
  --bucket velero \
  --secret-file ./credentials-velero \
  --use-node-agent \
  --use-volume-snapshots=false \
  --namespace velero \
  --backup-location-config region=minio,s3ForcePathStyle="true",s3Url=http://minio:9000 \
  --wait
```
:::warning 注意📢：
其中S3的地址指向本集群minio对象存储的svc地址。
:::

### 备份MOS项目

```bash
$ velero backup create app-backup \
  --default-volumes-to-fs-backup \
  --include-namespaces app-system
Backup request "app-backup" submitted successfully.
Run `velero backup describe app-backup` or `velero backup logs app-backup` for more details.
 
# 查看备份状态
$ velero backup get
NAME         STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES   STORAGE LOCATION   SELECTOR
app-backup   Completed   0        0          2023-03-28 16:34:56 +0800 CST   29d       default            <none>
```

- `--default-volumes-to-fs-backup`：默认将所有PV卷进行备份，详情查看官方文档。
- `--include-namespaces`：指定要备份的命名空间

登入minio控制台上可以看到备份的文件：

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/velero-practice-4.png)

### 恢复到集群B
```bash
# 到集群B中查看备份资源
$ velero backup get
NAME         STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES   STORAGE LOCATION   SELECTOR
app-backup   Completed   0        0          2023-03-28 16:41:55 +0800 CST   29d       default            <none>
 
# 执行恢复命令
$ velero restore create --from-backup app-backup
Restore request "app-backup-20230328164601" submitted successfully.
Run `velero restore describe app-backup-20230328164601` or `velero restore logs app-backup-20230328164601` for more details.
 
# 查看恢复任务
$ velero restore get 
NAME                        BACKUP       STATUS      STARTED                         COMPLETED                       ERRORS   WARNINGS   CREATED                         SELECTOR
app-backup-20230328164601   app-backup   Completed   2023-03-28 16:46:01 +0800 CST   2023-03-28 17:01:26 +0800 CST   0        30         2023-03-28 16:46:01 +0800 CST   <none>
```
### 验证服务和数据

```bash
$ kubectl get deploy,sts,svc,pvc -n app-system
NAME                                READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/hasura-graphql      1/1     1            1           29m
deployment.apps/iot-backend         1/1     1            1           29m
deployment.apps/iot-gateway         1/1     1            1           29m
deployment.apps/iot-history         1/1     1            1           29m
deployment.apps/iot-observer        1/1     1            1           29m
deployment.apps/app-backend         1/1     1            1           29m
deployment.apps/app-frontend        1/1     1            1           29m
 
NAME                                READY   AGE
statefulset.apps/minio              1/1     29m
statefulset.apps/mongo              1/1     29m
statefulset.apps/postgres           1/1     29m
statefulset.apps/rabbitmq           1/1     29m
statefulset.apps/redis              1/1     29m
 
NAME                        TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
service/hasura-graphql      ClusterIP   10.107.231.148   <none>        8080/TCP                              29m
service/iot-backend         ClusterIP   10.98.78.23      <none>        3000/TCP                              29m
service/iot-gateway         ClusterIP   10.108.211.114   <none>        1880/TCP                              29m
service/iot-history         ClusterIP   10.98.217.234    <none>        3000/TCP                              29m
service/iot-observer        ClusterIP   10.105.75.200    <none>        3010/TCP                              29m
service/minio               ClusterIP   10.97.14.151     <none>        9000/TCP,9001/TCP                     29m
service/mongo               ClusterIP   10.97.212.84     <none>        27017/TCP                             29m
service/app-backend         ClusterIP   10.107.16.116    <none>        5959/TCP                              29m
service/app-frontend        ClusterIP   10.100.136.90    <none>        80/TCP,443/TCP                        29m
service/postgres            ClusterIP   10.101.235.245   <none>        5432/TCP,9187/TCP                     29m
service/rabbitmq            ClusterIP   10.108.29.67     <none>        15672/TCP,5672/TCP                    29m
service/redis               ClusterIP   10.101.105.81    <none>        6379/TCP,9121/TCP                     29m
 
NAME                                       STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS       AGE
persistentvolumeclaim/data-minio-0         Bound    pvc-ca5c63bf-9aaa-4755-ad8f-35718f51decf   50Gi       RWO            openebs-hostpath   29m
persistentvolumeclaim/data-mongo-0         Bound    pvc-03203801-e339-44ee-bfb4-b196808c7cc5   50Gi       RWO            openebs-hostpath   29m
persistentvolumeclaim/data-postgres-0      Bound    pvc-e2f2593e-5869-420c-bd39-54ce01dfa63f   300Gi      RWO            openebs-hostpath   29m
persistentvolumeclaim/data-redis-0         Bound    pvc-a8e4445c-c6b5-483b-8b18-9d650daf35cc   2Gi        RWO            openebs-hostpath   29m
persistentvolumeclaim/app-backend          Bound    pvc-2b2f9747-a020-4a16-9975-2491457c4032   10Gi       RWO            openebs-hostpath   29m
```
