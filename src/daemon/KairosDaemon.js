/**
 * KAIROS Daemon - 守护进程系统
 * 
 * 核心功能：
 * 1. 守护进程模式 - 独立于主会话运行
 * 2. autoDream 记忆整合 - 夜间自动整合和修剪记忆
 * 3. 主动观察 - 基于事件触发主动行动
 * 4. 追加式日志 - 每日观察日志
 * 
 * 参考 Claude Code 源码分析：
 * - KAIROS在代码中出现150+次
 * - 守护进程模式下独立运行
 * - autoDream 在用户睡觉时运行
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// ============== Logger 类 - 追加式日志 ==============
class Logger {
    constructor(options = {}) {
        this.logDir = options.logDir || './logs';
        this.prefix = options.prefix || 'kairos';
        this.ensureLogDir();
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getLogFileName() {
        const date = new Date().toISOString().split('T')[0];
        return `${this.prefix}_${date}.log`;
    }

    getLogPath() {
        return path.join(this.logDir, this.getLogFileName());
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        if (data) {
            logEntry += ` | ${JSON.stringify(data)}`;
        }
        return logEntry;
    }

    write(level, message, data = null) {
        const logEntry = this.formatMessage(level, message, data) + '\n';
        const logPath = this.getLogPath();
        
        fs.appendFileSync(logPath, logEntry);
        // 同时输出到控制台
        console.log(logEntry.trim());
    }

    info(message, data = null) {
        this.write('INFO', message, data);
    }

    warn(message, data = null) {
        this.write('WARN', message, data);
    }

    error(message, data = null) {
        this.write('ERROR', message, data);
    }

    debug(message, data = null) {
        if (process.env.DEBUG) {
            this.write('DEBUG', message, data);
        }
    }

    // 获取今日日志内容
    getTodayLogs() {
        const logPath = this.getLogPath();
        if (fs.existsSync(logPath)) {
            return fs.readFileSync(logPath, 'utf-8');
        }
        return '';
    }

    // 获取指定日期的日志
    getLogsByDate(dateStr) {
        const logPath = path.join(this.logDir, `${this.prefix}_${dateStr}.log`);
        if (fs.existsSync(logPath)) {
            return fs.readFileSync(logPath, 'utf-8');
        }
        return '';
    }

    // 清理旧日志（保留天数）
    cleanOldLogs(retentionDays = 30) {
        const files = fs.readdirSync(this.logDir);
        const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
        
        let cleaned = 0;
        for (const file of files) {
            if (file.startsWith(this.prefix)) {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtimeMs < cutoffTime) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                }
            }
        }
        return cleaned;
    }
}

// ============== MemoryConsolidator 类 - 记忆整合器 ==============
class MemoryConsolidator {
    constructor(options = {}) {
        this.logger = options.logger || new Logger({ prefix: 'memory' });
        this.workspaceDir = options.workspaceDir || './workspace';
        this.memoryDir = options.memoryDir || './memory';
        this.autoDreamEnabled = options.autoDreamEnabled !== false;
        this.autoDreamHour = options.autoDreamHour || 3; // 默认凌晨3点
        this.lastConsolidation = null;
    }

    // 检查是否是夜间（用户睡觉时间）
    isNightTime() {
        const hour = new Date().getHours();
        return hour >= this.autoDreamHour && hour < this.autoDreamHour + 2;
    }

    // 获取需要整合的记忆文件
    getMemoryFiles() {
        const memoryFiles = [];
        const memoryPath = path.join(this.workspaceDir, this.memoryDir);
        
        if (!fs.existsSync(memoryPath)) {
            return memoryFiles;
        }

        const files = fs.readdirSync(memoryPath);
        for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.json')) {
                memoryFiles.push(path.join(memoryPath, file));
            }
        }
        return memoryFiles;
    }

    // 整合每日记忆文件
    consolidateDailyMemory() {
        this.logger.info('Starting daily memory consolidation');
        
        const memoryFiles = this.getMemoryFiles();
        const consolidated = {
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            files: [],
            totalSize: 0
        };

        for (const filePath of memoryFiles) {
            try {
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf-8');
                
                // 提取关键信息
                const keyInfo = this.extractKeyInfo(content, path.basename(filePath));
                
                consolidated.files.push({
                    name: path.basename(filePath),
                    size: stats.size,
                    keyInfo: keyInfo
                });
                consolidated.totalSize += stats.size;
            } catch (e) {
                this.logger.warn(`Failed to consolidate file: ${filePath}`, { error: e.message });
            }
        }

        this.lastConsolidation = Date.now();
        this.logger.info('Daily memory consolidation completed', { 
            filesCount: consolidated.files.length,
            totalSize: consolidated.totalSize 
        });

        return consolidated;
    }

    // 从内容中提取关键信息
    extractKeyInfo(content, filename) {
        const lines = content.split('\n').filter(l => l.trim());
        const info = {
            filename,
            lineCount: lines.length,
            keyPoints: [],
            todos: [],
            decisions: []
        };

        // 提取 TODO 项
        const todoRegex = /^-?\s*[-*]\s*TODO:?\s*(.+)/gi;
        let match;
        while ((match = todoRegex.exec(content)) !== null) {
            info.todos.push(match[1].trim());
        }

        // 提取决策（decision, decided, 决策等关键词）
        const decisionKeywords = ['decision:', 'decided:', '决策:', '决定:'];
        for (const line of lines) {
            const lower = line.toLowerCase();
            if (decisionKeywords.some(k => lower.includes(k))) {
                info.decisions.push(line.trim());
            }
        }

        // 提取前5行作为摘要
        info.keyPoints = lines.slice(0, 5).map(l => l.substring(0, 100));

        return info;
    }

    // 修剪旧记忆
    pruneOldMemory(retentionDays = 30) {
        this.logger.info('Pruning old memory files', { retentionDays });
        
        const memoryPath = path.join(this.workspaceDir, this.memoryDir);
        if (!fs.existsSync(memoryPath)) {
            return { pruned: 0, freedSpace: 0 };
        }

        const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
        const files = fs.readdirSync(memoryPath);
        
        let pruned = 0;
        let freedSpace = 0;

        for (const file of files) {
            // 只清理旧的每日记忆文件，保留 MEMORY.md
            if (file.match(/^\d{4}-\d{2}-\d{2}\.md$/) || file.match(/^\d{8}\.md$/)) {
                const filePath = path.join(memoryPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtimeMs < cutoffTime) {
                    fs.unlinkSync(filePath);
                    pruned++;
                    freedSpace += stats.size;
                    this.logger.debug(`Pruned old memory: ${file}`);
                }
            }
        }

        this.logger.info('Memory pruning completed', { pruned, freedSpace });
        return { pruned, freedSpace };
    }

    // 自动梦 - 在用户睡觉时运行整合
    async autoDream() {
        if (!this.autoDreamEnabled) {
            this.logger.debug('autoDream is disabled');
            return null;
        }

        if (!this.isNightTime()) {
            this.logger.debug('Not night time, skipping autoDream');
            return null;
        }

        this.logger.info('Running autoDream - Night time memory consolidation');

        try {
            const result = {
                consolidation: this.consolidateDailyMemory(),
                prune: this.pruneOldMemory(),
                timestamp: Date.now()
            };

            // 更新长期记忆摘要
            await this.updateLongTermSummary();

            this.logger.info('autoDream completed successfully');
            return result;
        } catch (e) {
            this.logger.error('autoDream failed', { error: e.message });
            return null;
        }
    }

    // 更新长期记忆摘要
    async updateLongTermSummary() {
        const memoryPath = path.join(this.workspaceDir, this.memoryDir);
        const summaryPath = path.join(memoryPath, 'memory_summary.json');
        
        // 收集所有记忆文件的摘要
        const summary = {
            lastUpdated: Date.now(),
            dailyMemories: [],
            totalEntries: 0
        };

        const files = fs.readdirSync(memoryPath);
        for (const file of files) {
            if (file.match(/^\d{4}-\d{2}-\d{2}\.md$/)) {
                const content = fs.readFileSync(path.join(memoryPath, file), 'utf-8');
                const lines = content.split('\n').filter(l => l.trim());
                summary.dailyMemories.push({
                    date: file.replace('.md', ''),
                    lineCount: lines.length,
                    preview: lines.slice(0, 3).join(' | ')
                });
                summary.totalEntries += lines.length;
            }
        }

        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        this.logger.debug('Long-term summary updated');
    }
}

// ============== Observer 类 - 主动观察 ==============
class Observer extends EventEmitter {
    constructor(options = {}) {
        super();
        this.logger = options.logger || new Logger({ prefix: 'observer' });
        this.workspaceDir = options.workspaceDir || './workspace';
        this.watchPaths = options.watchPaths || ['./memory', './workspace'];
        this.observers = new Map();
        this.actionQueue = [];
        this.debounceMs = options.debounceMs || 2000;
        this.enabled = options.enabled !== false;
    }

    // 启动观察
    start() {
        if (!this.enabled) {
            this.logger.info('Observer is disabled');
            return;
        }

        this.logger.info('Starting file system observer');
        
        // 观察记忆目录变化
        this.watchDirectory(path.join(this.workspaceDir, 'memory'));
        
        // 可以添加更多观察路径
        for (const watchPath of this.watchPaths) {
            const fullPath = path.join(this.workspaceDir, watchPath);
            if (fs.existsSync(fullPath)) {
                this.watchDirectory(fullPath);
            }
        }

        this.logger.info('File system observer started', { 
            paths: Array.from(this.observers.keys()) 
        });
    }

    // 观察目录
    watchDirectory(dirPath) {
        if (this.observers.has(dirPath)) {
            return;
        }

        try {
            const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                if (filename) {
                    this.handleFileChange(eventType, path.join(dirPath, filename));
                }
            });

            this.observers.set(dirPath, watcher);
            this.logger.debug(`Watching directory: ${dirPath}`);
        } catch (e) {
            this.logger.error(`Failed to watch directory: ${dirPath}`, { error: e.message });
        }
    }

    // 处理文件变化
    handleFileChange(eventType, filePath) {
        this.logger.debug('File change detected', { eventType, filePath });
        
        // 发送事件
        this.emit('change', { eventType, filePath, timestamp: Date.now() });

        // 根据文件类型触发不同动作
        const ext = path.extname(filePath);
        const basename = path.basename(filePath);

        if (ext === '.md') {
            this.handleMemoryChange(filePath, eventType);
        }
    }

    // 处理记忆文件变化
    handleMemoryChange(filePath, eventType) {
        const basename = path.basename(filePath);
        
        // 记忆文件变化时触发整合检查
        if (eventType === 'change' || eventType === 'rename') {
            // 添加到队列，使用防抖
            this.debounceAction('memory_change', {
                file: basename,
                type: eventType,
                timestamp: Date.now()
            });
        }
    }

    // 防抖动作处理
    debounceAction(actionType, data) {
        // 清除之前的相同动作
        this.actionQueue = this.actionQueue.filter(a => a.type !== actionType);
        
        this.actionQueue.push({ type: actionType, data, time: Date.now() });
        
        // 设置防抖延迟
        setTimeout(() => {
            this.processAction(actionType, data);
        }, this.debounceMs);
    }

    // 处理动作
    processAction(actionType, data) {
        this.logger.debug('Processing action', { actionType, data });
        
        switch (actionType) {
            case 'memory_change':
                this.emit('memoryChange', data);
                break;
            case 'high_priority':
                this.emit('highPriority', data);
                break;
            default:
                this.emit('action', { type: actionType, data });
        }
    }

    // 触发高优先级动作
    triggerHighPriority(type, data) {
        this.debounceAction('high_priority', { triggerType: type, ...data });
    }

    // 停止观察
    stop() {
        this.logger.info('Stopping file system observer');
        
        for (const [dirPath, watcher] of this.observers) {
            watcher.close();
            this.logger.debug(`Stopped watching: ${dirPath}`);
        }
        
        this.observers.clear();
    }

    // 获取观察状态
    getStatus() {
        return {
            enabled: this.enabled,
            watchingPaths: Array.from(this.observers.keys()),
            queueLength: this.actionQueue.length
        };
    }
}

// ============== Daemon 基类 ==============
class Daemon extends EventEmitter {
    constructor(options = {}) {
        super();
        this.name = options.name || 'KairosDaemon';
        this.logger = options.logger || new Logger({ prefix: this.name.toLowerCase() });
        this.running = false;
        this.intervalId = null;
        this.checkInterval = options.checkInterval || 60000; // 默认每分钟检查一次
    }

    // 启动守护进程
    start() {
        if (this.running) {
            this.logger.warn(`${this.name} is already running`);
            return false;
        }

        this.logger.info(`Starting ${this.name}`);
        this.running = true;
        
        this.emit('start');
        this.run();
        
        // 设置定期检查
        this.intervalId = setInterval(() => {
            this.run();
        }, this.checkInterval);

        return true;
    }

    // 停止守护进程
    stop() {
        if (!this.running) {
            return false;
        }

        this.logger.info(`Stopping ${this.name}`);
        this.running = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.emit('stop');
        return true;
    }

    // 运行守护进程逻辑（子类重写）
    run() {
        // 基类实现为空
    }

    // 获取状态
    getStatus() {
        return {
            name: this.name,
            running: this.running,
            uptime: this.running ? Date.now() - (this.startTime || 0) : 0
        };
    }
}

// ============== KAIROS 主守护进程 ==============
class KairosDaemon extends Daemon {
    constructor(options = {}) {
        super({ ...options, name: 'KairosDaemon' });
        
        this.workspaceDir = options.workspaceDir || './workspace';
        
        // 初始化组件
        this.logger = options.logger || new Logger({ 
            prefix: 'kairos', 
            logDir: path.join(this.workspaceDir, 'logs') 
        });
        
        this.memoryConsolidator = new MemoryConsolidator({
            logger: new Logger({ prefix: 'memory', logDir: path.join(this.workspaceDir, 'logs') }),
            workspaceDir: this.workspaceDir,
            autoDreamEnabled: options.autoDreamEnabled !== false,
            autoDreamHour: options.autoDreamHour || 3
        });
        
        this.observer = new Observer({
            logger: new Logger({ prefix: 'observer', logDir: path.join(this.workspaceDir, 'logs') }),
            workspaceDir: this.workspaceDir,
            enabled: options.observerEnabled !== false
        });

        // 绑定观察者事件
        this.setupObserverEvents();
    }

    // 设置观察者事件
    setupObserverEvents() {
        this.observer.on('memoryChange', (data) => {
            this.logger.info('Memory file changed', data);
            this.emit('memoryChange', data);
        });

        this.observer.on('highPriority', (data) => {
            this.logger.warn('High priority event detected', data);
            this.emit('highPriority', data);
        });
    }

    // 启动守护进程
    start() {
        const result = super.start();
        if (result) {
            this.startTime = Date.now();
            this.logger.info('KAIROS Daemon started', {
                workspace: this.workspaceDir,
                autoDreamEnabled: this.memoryConsolidator.autoDreamEnabled,
                observerEnabled: this.observer.enabled
            });

            // 启动文件系统观察
            this.observer.start();
        }
        return result;
    }

    // 停止守护进程
    stop() {
        const result = super.stop();
        if (result) {
            this.observer.stop();
            this.logger.info('KAIROS Daemon stopped');
        }
        return result;
    }

    // 主运行循环
    run() {
        if (!this.running) return;

        try {
            // 检查是否需要运行 autoDream
            this.checkAutoDream();
            
            // 记录心跳
            this.logger.debug('Heartbeat', { 
                uptime: Date.now() - this.startTime,
                memoryConsolidator: !!this.memoryConsolidator,
                observer: this.observer.getStatus()
            });
        } catch (e) {
            this.logger.error('Error in run loop', { error: e.message, stack: e.stack });
        }
    }

    // 检查并运行 autoDream
    checkAutoDream() {
        if (this.memoryConsolidator.isNightTime()) {
            // 使用防重入锁
            if (!this._autoDreamRunning) {
                this._autoDreamRunning = true;
                this.memoryConsolidator.autoDream()
                    .then(result => {
                        if (result) {
                            this.logger.info('autoDream executed', result);
                            this.emit('autoDream', result);
                        }
                    })
                    .finally(() => {
                        this._autoDreamRunning = false;
                    });
            }
        }
    }

    // 手动触发记忆整合
    triggerConsolidation() {
        this.logger.info('Manual consolidation triggered');
        return this.memoryConsolidator.consolidateDailyMemory();
    }

    // 手动触发修剪
    triggerPrune(retentionDays = 30) {
        this.logger.info('Manual prune triggered', { retentionDays });
        return this.memoryConsolidator.pruneOldMemory(retentionDays);
    }

    // 获取完整状态
    getStatus() {
        return {
            ...super.getStatus(),
            components: {
                memoryConsolidator: {
                    autoDreamEnabled: this.memoryConsolidator.autoDreamEnabled,
                    autoDreamHour: this.memoryConsolidator.autoDreamHour,
                    lastConsolidation: this.memoryConsolidator.lastConsolidation
                },
                observer: this.observer.getStatus()
            }
        };
    }

    // 获取今日日志
    getTodayLogs() {
        return this.logger.getTodayLogs();
    }

    // 获取指定日期日志
    getLogs(dateStr) {
        return this.logger.getLogsByDate(dateStr);
    }
}

// ============== 导出模块 ==============
module.exports = {
    Logger,
    MemoryConsolidator,
    Observer,
    Daemon,
    KairosDaemon
};

// 如果直接运行
if (require.main === module) {
    const workspaceDir = process.argv[2] || '/root/.openclaw/workspace';
    
    console.log(`Starting KAIROS Daemon in ${workspaceDir}...`);
    
    const daemon = new KairosDaemon({
        workspaceDir,
        autoDreamEnabled: true,
        autoDreamHour: 3,
        observerEnabled: true,
        checkInterval: 60000 // 每分钟检查
    });

    // 处理退出信号
    process.on('SIGINT', () => {
        console.log('\nShutting down KAIROS Daemon...');
        daemon.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\nShutting down KAIROS Daemon...');
        daemon.stop();
        process.exit(0);
    });

    // 启动
    daemon.start();
    
    console.log('KAIROS Daemon is running. Press Ctrl+C to stop.');
}