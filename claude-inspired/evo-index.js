/**
 * VoiceForge Evolution - 整合版
 * 吸收Claude Code优点的进化系统
 * 
 * 使用: import { createVoiceForge } from './evo-index.js';
 */

import { kairos } from './kairos.js';
import { buddyManager, PETS, MOODS, HATS } from './buddy.js';
import { ultraPlanner } from './ultraplan.js';

/**
 * 创建VoiceForge进化版系统
 */
export async function createVoiceForge() {
  console.log('🚀 初始化 VoiceForge 进化版...');
  
  return {
    // ============ KAIROS 持久记忆 ============
    kairos: {
      // 添加短期记忆
      add: (content, type = 'general', opts = {}) => 
        kairos.addShortTerm(content, type, opts),
      
      // 搜索记忆
      search: (query, limit = 10) => 
        kairos.search(query, limit),
      
      // 获取构建上下文（用于LLM prompt）
      getContext: (task, limit = 5) => 
        kairos.getRelevantContext(task, limit),
      
      // 记住关键事实
      remember: (fact, importance = 7) => 
        kairos.rememberFact(fact, importance),
      
      // 保存用户偏好
      savePreference: (key, value, userId = 'default') => 
        kairos.savePreference(key, value, userId),
      
      // 获取用户偏好
      getPreferences: (userId) => 
        kairos.getPreferences(userId),
      
      // 保存项目上下文
      saveProjectContext: (projectId, context) => 
        kairos.saveProjectContext(projectId, context),
      
      // 获取项目上下文
      getProjectContext: (projectId) => 
        kairos.getProjectContext(projectId),
      
      // 统计
      stats: () => kairos.getStats()
    },
    
    // ============ BUDDY 宠物系统 ============
    buddy: {
      // 创建宠物
      create: (species = 'cat', name) => 
        buddyManager.create(species, name),
      
      // 互动
      interact: (action) => 
        buddyManager.interact(action),
      
      // 获取状态
      getStatus: () => 
        buddyManager.getStatus(),
      
      // 换装
      setHat: (hat) => 
        buddyManager.setHat(hat),
      
      // 心情
      setMood: (mood) => 
        buddyManager.setMood(mood),
      
      // 数据
      pets: PETS,
      moods: MOODS,
      hats: HATS
    },
    
    // ============ ULTRAPLAN 规划系统 ============
    planner: {
      // 创建深度规划
      createPlan: (goal, context) => 
        ultraPlanner.createPlan(goal, context),
      
      // 获取状态
      getStatus: () => 
        ultraPlanner.getPlanStatus(),
      
      // 更新进度
      updateProgress: (taskId, status) => 
        ultraPlanner.updateProgress(taskId, status),
      
      // 取消
      cancel: () => 
        ultraPlanner.cancelPlan()
    }
  };
}

export default { createVoiceForge };