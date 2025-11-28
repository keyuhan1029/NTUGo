# MongoDB 连接问题修复指南

## 问题症状
SSL/TLS 握手错误：`ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`

## 解决方案

### 步骤 1: 检查 MongoDB Atlas 网络访问设置（最重要！）

1. 访问 https://cloud.mongodb.com/
2. 登录您的账户
3. 点击左侧菜单的 **"Network Access"** (网络访问)
4. 检查是否有允许的 IP 地址列表
5. 点击 **"Add IP Address"** (添加 IP 地址)
6. 选择以下选项之一：
   - **"Add Current IP Address"** - 添加您当前的 IP
   - **"Allow Access from Anywhere"** - 允许所有 IP (0.0.0.0/0) - **仅用于开发环境**
7. 点击 **"Confirm"**
8. 等待 1-2 分钟让设置生效

### 步骤 2: 测试连接

运行测试脚本：
```bash
node scripts/test-mongodb-connection.js
```

### 步骤 3: 如果仍然失败

1. **重新生成连接字符串**：
   - 在 MongoDB Atlas 中点击 "Database" → "Connect"
   - 选择 "Drivers" → "Node.js"
   - 复制新的连接字符串
   - 更新 `.env.local` 中的 `MONGODB_URI`

2. **检查数据库用户密码**：
   - 确认密码是否正确
   - 如果密码包含特殊字符（如 `@`, `#`, `%` 等），需要 URL 编码
   - 例如：`@` → `%40`, `#` → `%23`

3. **重启开发服务器**：
   ```bash
   # 停止服务器 (Ctrl+C)
   npm run dev
   ```

## 常见问题

### Q: 为什么会出现 SSL/TLS 错误？
A: 这通常是因为 MongoDB Atlas 阻止了您的 IP 地址访问数据库。

### Q: 使用 0.0.0.0/0 安全吗？
A: 不，这只应该用于开发环境。生产环境应该只允许特定的 IP 地址。

### Q: 如何查找我的 IP 地址？
A: 访问 https://whatismyipaddress.com/ 查看您的公共 IP
