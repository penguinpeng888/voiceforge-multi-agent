/**
 * Permission System - Claude Code 权限系统复刻
 * 
 * 三种权限模式:
 * - bypass: 无检查，最快但危险
 * - allow: 自动允许编辑工作目录
 * - auto: LLM分类器预测是否批准
 */

class PermissionSystem {
  constructor(options = {}) {
    this.mode = options.mode || 'auto';
    this.workingDir = options.workingDir || process.cwd();
    this.dangerousPatterns = [
      /rm\s+-rf/,
      /format\s+c:/i,
      /del\s+\/[sfq]/,
      />\s*\/dev\//,
      /chmod\s+777/,
      /sudo\s+rm/,
      /DROP\s+TABLE/i,
      /DELETE\s+FROM/i
    ];
    
    // 权限日志
    this.log = [];
  }

  /**
   * 设置权限模式
   */
  setMode(mode) {
    const validModes = ['bypass', 'allow', 'auto'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid mode: ${mode}. Valid: ${validModes.join(', ')}`);
    }
    this.mode = mode;
  }

  /**
   * 检查动作权限
   */
  async checkAction(toolName, input, context = {}) {
    const action = {
      tool: toolName,
      input,
      context,
      timestamp: Date.now(),
      mode: this.mode
    };

    // Bypass 模式：直接允许
    if (this.mode === 'bypass') {
      return this.createResult(true, 'bypass', action);
    }

    // Allow 模式：允许工作目录内的编辑
    if (this.mode === 'allow') {
      if (this.isWriteTool(toolName) && this.isInWorkingDir(input)) {
        return this.createResult(true, 'allowed_by_working_dir', action);
      }
      return this.createResult(true, 'allow_mode', action);
    }

    // Auto 模式：智能判断
    return this.checkAutoMode(action);
  }

  /**
   * Auto 模式检查
   */
  async checkAutoMode(action) {
    const { tool, input } = action;
    
    // 只读工具总是允许
    if (this.isReadTool(tool)) {
      return this.createResult(true, 'readonly_tool', action);
    }

    // 检查危险模式
    const inputStr = JSON.stringify(input);
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(inputStr)) {
        this.logAction(action, false, 'dangerous_pattern');
        return this.createResult(false, 'dangerous_pattern', action);
      }
    }

    // 检查是否是重要目录
    if (this.isProtectedPath(input)) {
      this.logAction(action, false, 'protected_path');
      return this.createResult(false, 'protected_path', action);
    }

    // 检查工具类型
    if (this.isWriteTool(tool)) {
      // 写入工具需要更仔细检查
      if (this.hasBackup(input)) {
        return this.createResult(true, 'has_backup', action);
      }
    }

    // 默认允许（但记录）
    this.logAction(action, true, 'auto_default');
    return this.createResult(true, 'auto_default', action);
  }

  /**
   * 判断是否是只读工具
   */
  isReadTool(toolName) {
    const readTools = ['read', 'grep', 'glob', 'search', 'fetch', 'web-fetch', 
                      'web-search', 'find', 'list', 'cat', 'ls', 'dir'];
    return readTools.includes(toolName.toLowerCase());
  }

  /**
   * 判断是否是写入工具
   */
  isWriteTool(toolName) {
    const writeTools = ['write', 'edit', 'delete', 'remove', 'mkdir', 'bash',
                       'run', 'execute', 'install', 'npm', 'pip', 'git'];
    return writeTools.some(t => toolName.toLowerCase().includes(t));
  }

  /**
   * 检查是否在工作目录内
   */
  isInWorkingDir(input) {
    if (!input || !input.path) return true;
    const filePath = input.path.toString();
    return filePath.startsWith(this.workingDir);
  }

  /**
   * 检查是否是保护路径
   */
  isProtectedPath(input) {
    if (!input || !input.path) return false;
    const filePath = input.path.toString().toLowerCase();
    const protectedPaths = [
      '/etc/passwd',
      '/etc/shadow',
      '/etc/sudoers',
      'c:\\windows',
      'c:\\program files',
      '/.ssh/',
      '/.aws/',
      '/.env',
      '/node_modules/.package-lock'
    ];
    return protectedPaths.some(p => filePath.includes(p.toLowerCase()));
  }

  /**
   * 检查是否有备份
   */
  hasBackup(input) {
    // 简单检查：输入中是否包含 backup 字段
    return input && input.backup;
  }

  /**
   * 创建结果
   */
  createResult(allowed, reason, action) {
    return {
      allowed,
      reason,
      action,
      suggestion: allowed ? null : this.getSuggestion(action)
    };
  }

  /**
   * 获取建议
   */
  getSuggestion(action) {
    if (action.input.path) {
      return `考虑备份 ${action.input.path} 后再继续`;
    }
    return '该操作被阻止';
  }

  /**
   * 记录动作
   */
  logAction(action, allowed, reason) {
    this.log.push({
      ...action,
      allowed,
      reason,
      loggedAt: Date.now()
    });
    
    // 保持日志在1000条以内
    if (this.log.length > 1000) {
      this.log = this.log.slice(-500);
    }
  }

  /**
   * 获取日志
   */
  getLog(limit = 50) {
    return this.log.slice(-limit);
  }

  /**
   * 获取统计
   */
  getStats() {
    const total = this.log.length;
    const allowed = this.log.filter(l => l.allowed).length;
    const blocked = total - allowed;
    
    return {
      mode: this.mode,
      total,
      allowed,
      blocked,
      blockRate: total > 0 ? (blocked / total * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * 重置日志
   */
  resetLog() {
    this.log = [];
  }
}

module.exports = PermissionSystem;