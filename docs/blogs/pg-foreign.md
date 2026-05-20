# PostgreSQL 外部表（Foreign Table）创建与问题排查指南

# 一、核心概念

- **外部表（Foreign Table）**：本地不存储数据，仅映射远端数据库表，查询时实时拉取远端数据，约束、默认值等均由远端表控制。

- **FDW（Foreign Data Wrapper）**：外部数据包装器，负责本地与远端数据库的通信，最常用 `postgres\_fdw`（用于连接另一台 PostgreSQL）。

- **外部服务器（SERVER）**：定义远端数据库的连接信息（IP、端口、库名等）。

- **用户映射（USER MAPPING）**：建立本地用户与远端数据库用户的关联，用于身份验证。

# 二、完整创建流程（postgres\_fdw）

## 1\. 安装 postgres\_fdw 扩展（仅需执行一次）

```sql
-- 安全创建，不存在则安装，存在不报错
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
```

## 2\. 查询扩展是否安装成功

```sql
-- 有返回结果 = 已安装；无返回 = 未安装
SELECT * FROM pg_extension WHERE extname = 'postgres_fdw';
```

## 3\. 创建外部服务器（SERVER）

关键：host 用 `127\.0\.0\.1`（IPv4），避免 IPv6（::1）权限问题；所有 OPTIONS 值需加单引号。

```sql
-- 创建服务器（名称：remote_users，可自定义）
CREATE SERVER IF NOT EXISTS remote_users
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
  host '127.0.0.1',  -- 远端IP（本机用127.0.0.1，避免::1权限问题）
  port '5432',        -- 远端PostgreSQL端口（默认5432）
  dbname 'users',     -- 远端目标数据库名
  fetch_size '10000'  -- 每次拉取数据条数，优化查询速度
);
```

## 4\. 查询外部服务器是否创建成功

### 方法1：SQL查询（精准查看）

```sql
-- 查看指定服务器详情（含IP、端口、库名）
SELECT
  srvname AS 服务器名称,
  srvowner AS 所有者ID,
  fdwname AS 外部数据包装器,
  srvoptions AS 连接配置
FROM pg_foreign_server fs
JOIN pg_foreign_data_wrapper fdw ON fs.srvfdw = fdw.oid
WHERE srvname = 'remote_users';
```

### 方法2：psql快捷命令（简洁查看）

```sql
\des+  -- 显示所有外部服务器完整详情
```

## 5\. 创建用户映射（USER MAPPING）

关键：给当前登录用户（此处为 pro\_gis）创建映射，否则无法连接远端库。

```sql
-- 给 pro_gis 用户创建映射（关联远端数据库账号密码）
CREATE USER MAPPING IF NOT EXISTS FOR pro_gis
SERVER remote_users
OPTIONS (
  user 'pro_gis',      -- 远端数据库用户名（需有远端库访问权限）
  password '你的密码'   -- 远端数据库密码（替换为真实密码）
);
```

## 6\. 查询用户映射是否创建成功

### 方法1：精准查询 pro\_gis 的映射

```sql
SELECT 
  usename AS 本地用户,
  srvname AS 外部服务器,
  umoptions AS 远端账号密码
FROM pg_user_mappings um
JOIN pg_roles r ON um.umuser = r.oid
JOIN pg_foreign_server s ON um.umserver = s.oid
WHERE usename = 'pro_gis';
```

### 方法2：查看所有映射

```sql
SELECT * FROM pg_user_mappings;
```

### 方法3：psql快捷命令

```sql
\deu+  -- 显示所有用户映射详情
```

## 7\. 创建外部表（映射远端表）

注意：外部表仅需定义字段名和类型，**不能加 NOT NULL、DEFAULT、主键、序列**（均由远端表控制），字段需与远端表完全一致。

```sql
CREATE FOREIGN TABLE "public"."t_func_dic_foreign" (
  "id" int4,
  "function_code" varchar(100),
  "name" varchar(100),
  "description" varchar(1000),
  "can_assign_role" bool,
  "classic" varchar(255),
  "permissiontag" jsonb
)
SERVER remote_users  -- 关联创建好的外部服务器
OPTIONS (
  schema_name 'public',          -- 远端表所属schema
  table_name 't_function_permission_dic'  -- 远端真实表名（必须正确）
);
```

## 8\. 验证外部表可用性

```sql
-- 查询外部表数据（与查询普通表一致）
SELECT * FROM t_func_dic_foreign LIMIT 5;
```

# 三、常见报错及解决方案

## 报错1：ERROR server \&\#34;remote\_pg\&\#34; does not exist

- **原因**：未创建指定名称的外部服务器，或服务器名称拼写错误。

- **解决方案**：按“二、3”步骤创建外部服务器，确保服务器名称与外部表中引用的一致。

## 报错2：user mapping not found for \&\#34;pro\_gis\&\#34;

- **原因**：当前登录用户 pro\_gis 没有对应的用户映射（未关联远端账号密码）。

- **解决方案**：按“二、5”步骤，给 pro\_gis 用户创建用户映射。

## 报错3：could not connect to server \&\#34;romote\_uses\&\#34;

- **原因**：1\. 外部服务器名称拼写错误（如 romote\_uses → remote\_users）；2\. 连接信息（IP、端口、库名）错误。

- **解决方案**：删除错误服务器和映射，按“二、3”“二、5”步骤重建，确保名称和连接信息正确。

## 报错4：fatal: no pg\_hba\.conf entry for host \&\#34;::1\&\#34;, user \&\#34;pro\_gis\&\#34;, database \&\#34;users\&\#34;, SSL off

- **原因**：localhost 解析为 IPv6（::1），但 pg\_hba\.conf 未允许 IPv6 连接。

- **解决方案**：将外部服务器的 host 从 localhost 改为 127\.0\.0\.1（强制走 IPv4），删除旧服务器和映射后重建（参考“二、3”）。

# 四、删除操作（清空重建用）

注意：必须先删除用户映射，再删除外部服务器，最后删除外部表。

```sql
-- 1. 删除用户映射（pro_gis 用户 + remote_users 服务器）
DROP USER MAPPING IF EXISTS FOR pro_gis SERVER remote_users;

-- 2. 删除外部服务器
DROP SERVER IF EXISTS remote_users;

-- 3. （可选）删除外部表
DROP FOREIGN TABLE IF EXISTS public.t_func_dic_foreign;
```

# 五、关键注意事项

1. 外部表字段名、类型、顺序必须与远端表完全一致，否则查询报错。

2. 外部表不能定义约束（主键、NOT NULL）、默认值、自增序列，所有规则由远端表控制。

3. 用户映射必须与当前登录用户一致，谁要访问外部表，就给谁创建映射。

4. 远端数据库需开放权限：确保 pg\_hba\.conf 允许本地 IP 访问，防火墙/安全组开放 5432 端口。

5. OPTIONS 中所有值（包括数字）必须加单引号，否则会报错。

> （注：文档部分内容可能由 AI 生成）
