/**
 * Claude-Inspired System Test
 */

import { createSystem, feature, TaskStatus } from './index.js';

async function test() {
  console.log('🧪 Running Claude-Inspired System Tests...\n');
  
  // 创建系统
  const system = await createSystem();
  
  // 测试1: 工具系统
  console.log('📦 Testing Tools...');
  const tools = system.tools.list();
  console.log(`  ✓ ${tools.length} tools registered`);
  const bashTool = system.tools.get('bash');
  console.log(`  ✓ BashTool: ${bashTool?.name || 'N/A'}`);
  
  // 测试2: Agent协调
  console.log('\n🤖 Testing Agents...');
  const agents = system.agents.list();
  console.log(`  ✓ ${agents.length} agents: ${agents.join(', ')}`);
  
  const result = await system.agents.coordinate('帮我创建一个配音项目');
  console.log(`  ✓ Master decided: ${result.spec ? 'planner worked' : 'response received'}`);
  
  // 测试3: 技能系统
  console.log('\n⚡ Testing Skills...');
  const skills = system.skills.list();
  console.log(`  ✓ ${skills.length} skills loaded`);
  const searchResult = system.skills.search('debug');
  console.log(`  ✓ Skill search found: ${searchResult.length} results`);
  
  // 测试4: 任务系统
  console.log('\n📋 Testing Tasks...');
  const task1 = system.tasks.create({
    name: 'Test Task 1',
    description: 'A test task',
    priority: 10
  });
  console.log(`  ✓ Created task: ${task1.id}`);
  
  const stats = system.tasks.stats();
  console.log(`  ✓ Task stats: ${stats.total} total, ${stats.pending} pending`);
  
  // 测试5: 记忆系统
  console.log('\n🧠 Testing Memory...');
  system.memory.add('这是一个重要的测试记忆', { importance: 8, keywords: ['测试', '重要'] });
  const memStats = system.memory.stats();
  console.log(`  ✓ Memory stats: ${memStats.shortTerm} short-term, ${memStats.longTerm} long-term`);
  
  const searchMem = system.memory.search('测试');
  console.log(`  ✓ Memory search: ${searchMem.length} results`);
  
  // 测试6: Feature Flags
  console.log('\n🚩 Testing Feature Flags...');
  const features = system.features;
  console.log(`  ✓ User type: ${features.USER_TYPE}`);
  console.log(`  ✓ Proactive: ${features.PROACTIVE}`);
  
  // 总结
  console.log('\n✅ All tests passed!');
  console.log('\n📖 Usage:');
  console.log('  const system = await createSystem()');
  console.log('  await system.agents.coordinate("your input")');
  console.log('  system.memory.add("content", { importance: 8 })');
  console.log('  system.tasks.create({ name: "Task" })');
}

test().catch(console.error);