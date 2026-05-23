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

const FALLBACK_PROMPTS = [
  { id: 1, title: '城市夜景', style: 'realistic', prompt: '繁华城市夜景，霓虹灯光，车流长曝光，赛博朋克风格' },
  { id: 2, title: '樱花少女', style: 'anime', prompt: '樱花树下的少女，柔和的粉色光线，花瓣飘落，动漫风格' },
  { id: 3, title: '山海经神兽', style: '3d', prompt: '神话中的麒麟，鳞片细节丰富，中国风 3D 渲染' },
  { id: 4, title: '蘑菇小屋', style: 'scene', prompt: '魔法森林中的发光的蘑菇小屋，蓝紫色调，宫崎骏风格' },
  { id: 5, title: '咖啡馆一日', style: 'scene', prompt: '安静的咖啡馆内景，暖色灯光，一杯拿铁，氛围感' },
  { id: 6, title: '雪山湖泊', style: 'realistic', prompt: '雪山倒映在湖面，冷蓝色调，极简构图，写实摄影' },
  { id: 7, title: '橙色猫咪', style: 'illustration-standing', prompt: '一只橘猫坐在窗台上，阳光洒落，扁平插画风格' },
  { id: 8, title: '赛博机车', style: 'vfx', prompt: '赛博朋克摩托车，霓虹灯光效，雨夜街道，科幻特效' },
  { id: 9, title: '古风女子', style: 'illustration-standing', prompt: '古风女子执扇立于桃花树下，淡雅国风，水墨质感' },
  { id: 10, title: 'UI 登录页', style: 'ui', prompt: '极简风格的登录界面，毛玻璃效果，暗色模式，适配移动端' },
  { id: 11, title: 'App 首页', style: 'ue', prompt: '音乐 App 首页，推荐歌单卡片，沉浸式播放器，用户旅程' },
  { id: 12, title: '太空漫步', style: 'realistic', prompt: '宇航员漂浮在地球上空，星空背景，科幻写实风格' },
]

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'scene', label: '场景' },
  { key: 'realistic', label: '写实' },
  { key: 'anime', label: '动漫' },
  { key: '3d', label: '3D' },
  { key: 'illustration-standing', label: '立绘' },
  { key: 'ui', label: 'UI' },
  { key: 'ue', label: 'UE' },
  { key: 'vfx', label: '特效' },
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

export { CATEGORIES }

export function getPrompts() {
  if (promptCache) return promptCache
  const cached = loadFromCache()
  if (cached) { promptCache = cached; return cached }
  promptCache = enrich(FALLBACK_PROMPTS)
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
    promptCache = enrich(FALLBACK_PROMPTS)
    return promptCache
  }
}
