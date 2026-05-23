const { createShareOptions, createTimelineOptions } = require('../../utils/share')
const { getPrompts, fetchRemotePrompts, CATEGORIES } = require('../../services/prompts')

Page({
  data: {
    tab: 'generate',
    prompt: '',
    negativePrompt: '',
    results: [],
    generating: false,
    style: 'realistic',
    ratio: '1:1',
    cfgScale: 7,
    canGenerate: false,
    library: getPrompts(),
    filteredLibrary: getPrompts(),
    libraryTab: 'all',
    searchQuery: '',
    detailItem: null,
    categories: CATEGORIES,
  },

  onLoad() {
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
    this.loadRemotePrompts()
  },

  async loadRemotePrompts() {
    const list = await fetchRemotePrompts()
    this.setData({ library: list, filteredLibrary: list })
  },

  onShareAppMessage() {
    return createShareOptions({
      title: '咔拼鸭 - AI 生图',
      path: '/pages/generate/generate'
    })
  },

  onShareTimeline() {
    return createTimelineOptions({
      title: '咔拼鸭 - AI 生图'
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab) this.setData({ tab })
  },

  onPromptInput(e) {
    const val = e.detail.value
    this.setData({
      prompt: val,
      canGenerate: val.trim().length > 0,
    })
  },

  setStyle(e) {
    const style = e.currentTarget.dataset.style
    if (style) this.setData({ style })
  },

  setRatio(e) {
    const ratio = e.currentTarget.dataset.ratio
    if (ratio) this.setData({ ratio })
  },

  onNegativeInput(e) {
    this.setData({ negativePrompt: e.detail.value })
  },

  onCfgChange(e) {
    this.setData({ cfgScale: e.detail.value })
  },

  onSearchInput(e) {
    const q = e.detail.value
    this.setData({ searchQuery: q }, () => this.filterLibrary())
  },

  setLibraryTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab) this.setData({ libraryTab: tab }, () => this.filterLibrary())
  },

  filterLibrary() {
    const { library, libraryTab, searchQuery } = this.data
    const q = searchQuery.trim().toLowerCase()
    const filtered = library.filter(item => {
      if (libraryTab !== 'all' && item.style !== libraryTab) return false
      if (q && !item.prompt.toLowerCase().includes(q) && !item.styleName.includes(q)) return false
      return true
    })
    this.setData({ filteredLibrary: filtered })
  },

  showDetail(e) {
    const id = Number(e.currentTarget.dataset.id)
    const item = this.data.library.find(p => p.id === id)
    if (item) this.setData({ detailItem: item })
  },

  closeDetail() {
    this.setData({ detailItem: null })
  },

  copyPrompt() {
    const item = this.data.detailItem
    if (!item) return
    wx.setClipboardData({
      data: item.prompt,
      success() { wx.showToast({ title: '提示词已复制', icon: 'success' }) }
    })
  },

  useThisPrompt() {
    const item = this.data.detailItem
    if (!item) return
    this.setData({
      prompt: item.prompt,
      canGenerate: true,
      style: item.style,
      detailItem: null,
      tab: 'generate',
    })
  },

  async doGenerate() {
    if (!this.data.prompt.trim()) {
      wx.showToast({ title: '请输入描述', icon: 'none' })
      return
    }
    this.setData({ generating: true, results: [] })
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      this.setData({ generating: false })
    } catch (err) {
      this.setData({ generating: false })
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.src
    if (url) wx.previewImage({ urls: [url], current: url })
  },

  saveImage(e) {
    const url = e.currentTarget.dataset.src
    if (!url) return
    wx.showLoading({ title: '保存中...', mask: true })
    wx.saveImageToPhotosAlbum({
      filePath: url,
      success() { wx.hideLoading(); wx.showToast({ title: '已保存', icon: 'success' }) },
      fail() { wx.hideLoading(); wx.showToast({ title: '保存失败', icon: 'none' }) }
    })
  },
})
