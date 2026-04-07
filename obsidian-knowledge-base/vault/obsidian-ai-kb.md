---
title: Obsidian AI 知识库搭建
date: 2026-04-07
source: https://blakecrosley.com/guides/obsidian
tags: ["obsidian", "ai", "knowledge-base", "rag"]
---

# Obsidian AI 知识库搭建

## 核心理念
Obsidian 是本地优先、纯文本、图结构的 markdown 语料库，添加检索层后成为 AI 上下文库。

## 技术架构
1. 存储：Obsidian Markdown（本地优先）
2. 检索：BM25 + 向量搜索（混合检索）
3. AI接入：MCP Server
4. Embedding：Model2Vec（本地）

## Karpathy 方法
- 数据收集到 raw 目录
- LLM 增量编译为 wiki
- Obsidian 作为前端
- 不需要高级 RAG

## 混合检索
- BM25：精确匹配
- 向量搜索：语义匹配
- RRF：融合结果
