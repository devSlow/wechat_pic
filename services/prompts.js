const STYLE_MAP = {
  ui: 'UI', ue: 'UE', 'illustration-standing': '立绘', '3d': '3D',
  anime: '动漫', realistic: '写实', vfx: '特效', scene: '场景',
  sketch: '素描', oil: '油画',
}
const CACHE_KEY = 'prompt_library_cache'

const COLORS = [
  ['#3B82F6', '#DBEAFE'], ['#EC4899', '#FDF2F8'], ['#8B5CF6', '#F5F3FF'],
  ['#F59E0B', '#FFFBEB'], ['#06B6D4', '#ECFEFF'], ['#22C55E', '#F0FDF4'],
  ['#F97316', '#FEF3C7'], ['#D946EF', '#FDF4FF'], ['#0EA5E9', '#E0F2FE'],
  ['#6366F1', '#EEF2FF'], ['#DB2777', '#FDF2F8'], ['#1E293B', '#F1F5F9'],
]

let promptCache = null

function toStyleName(style) {
  return STYLE_MAP[style] || style
}

function enrich(items) {
  return items.map((p, i) => ({
    id: p.id || i + 1,
    title: p.title || '',
    style: p.style || p.category || 'scene',
    prompt: p.prompt || '',
    thumbnail: (p.thumbnail && p.thumbnail.startsWith('http')) ? p.thumbnail : '',
    styleName: toStyleName(p.style || p.category),
    colors: p.colors || COLORS[i % COLORS.length],
    glyph: p.glyph || (p.title ? p.title.replace(/例\s*\d+[：:]?\s*/, '')[0] : '?'),
  }))
}

function loadFromCache() {
  try {
    const raw = wx.getStorageSync(CACHE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) return enrich(data)
    }
  } catch (e) {}
  return null
}

function saveToCache(items) {
  try { wx.setStorageSync(CACHE_KEY, JSON.stringify(items)) } catch (e) {}
}

export function getPrompts() {
  if (promptCache) return promptCache
  const cached = loadFromCache()
  if (cached) { promptCache = cached; return cached }
  promptCache = enrich(require('../data/prompts.json'))
  return promptCache
}

export async function fetchRemotePrompts(url) {
  const remote = url || 'https://cdn.jsdelivr.net/gh/devSlow/wechat_pic@main/data/prompts.json'
  try {
    const res = await new Promise((resolve, reject) => {
      wx.request({ url: remote, method: 'GET', success: resolve, fail: reject, timeout: 10000 })
    })
    const data = res.data
    if (!Array.isArray(data) || data.length === 0) throw new Error('empty')
    saveToCache(data)
    promptCache = enrich(data)
    return promptCache
  } catch (e) {
    const cached = loadFromCache()
    if (cached) return cached
    promptCache = enrich(require('../data/prompts.json'))
    return promptCache
  }
}
