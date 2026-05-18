const { chooseImage, saveImage, showToast } = require('../../utils/util')
const { compositeImages, compositeCollage, gridCut } = require('../../utils/canvas')

Page({
  data: {
    mode: 'stitch',
    direction: 'vertical',
    images: [],
    slots: [],

    primary: '#2563EB',
    collageLayout: '',
    collageImages: [],
    collageCols: 2,
    collageFilled: 0,
    resultImages: [],
    grid9Image: '',
    grid9Result: [],
    animClass: '',
    canvasWidth: 600
  },

  onLoad() {
    this.updateSlots()
    const windowInfo = wx.getWindowInfo()
    this.setData({ canvasWidth: windowInfo.windowWidth })
  },

  updateSlots() {
    const total = Math.min(Math.max(this.data.images.length + 2, 2), 9)
    const slots = []
    for (let i = 0; i < total; i++) {
      if (i < this.data.images.length) {
        slots.push({ type: 'filled', path: this.data.images[i], index: i })
      } else {
        slots.push({ type: 'empty', index: i })
      }
    }
    this.setData({ slots })
  },

  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode, resultImages: [] })
  },

  selectDirection(e) {
    this.setData({ direction: e.currentTarget.dataset.dir })
  },

  toggleDirection() {
    this.setData({ direction: this.data.direction === 'vertical' ? 'horizontal' : 'vertical' })
  },

  async addImage() {
    const remaining = 9 - this.data.images.length
    if (remaining <= 0) return
    try {
      const paths = await chooseImage(remaining)
      if (paths.length) {
        const newImages = [...this.data.images, ...paths].slice(0, 9)
        this.setData({ images: newImages })
        this.updateSlots()
      }
    } catch (err) {}
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== idx)
    this.setData({ images })
    this.updateSlots()
  },

  async doStitch() {
    if (this.data.images.length < 2) { showToast('至少选择2张图片'); return }
    wx.showLoading({ title: '拼接中...', mask: true })
    try {
      const tempPath = await compositeImages('stitchCanvas', this.data.images, this.data.direction, this.data.canvasWidth, 0, '#FFFFFF')
      this.setData({ resultImages: [tempPath], animClass: 'anim-pop' })
      setTimeout(() => { if (this.data.animClass === 'anim-pop') this.setData({ animClass: '' }) }, 400)
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      showToast('拼接失败')
    }
  },

  initCollageImages(layout) {
    const [cols, rows] = layout.split('x').map(Number)
    const total = cols * rows
    this.setData({
      collageLayout: layout,
      collageCols: cols,
      collageImages: new Array(total).fill(null),
      collageFilled: 0
    })
  },

  selectCollageLayout(e) {
    this.initCollageImages(e.currentTarget.dataset.layout)
    this.setData({ resultImages: [] })
  },

  async addCollageImage(e) {
    const idx = e.currentTarget.dataset.index
    if (this.data.collageImages[idx]) return
    try {
      const paths = await chooseImage(1)
      if (paths.length) {
        const images = [...this.data.collageImages]
        images[idx] = paths[0]
        this.setData({ collageImages: images, collageFilled: this.data.collageFilled + 1 })
      }
    } catch (err) {}
  },

  async addCollageImages() {
    const remaining = this.data.collageImages.length - this.data.collageFilled
    if (remaining <= 0) return
    try {
      const paths = await chooseImage(remaining)
      if (paths.length) {
        const images = [...this.data.collageImages]
        let filled = this.data.collageFilled
        for (const path of paths) {
          const emptyIdx = images.indexOf(null)
          if (emptyIdx !== -1) {
            images[emptyIdx] = path
            filled++
          }
        }
        this.setData({ collageImages: images, collageFilled: filled })
      }
    } catch (err) {}
  },

  removeCollageImage(e) {
    const idx = e.currentTarget.dataset.index
    if (!this.data.collageImages[idx]) return
    const images = [...this.data.collageImages]
    images[idx] = null
    this.setData({ collageImages: images, collageFilled: this.data.collageFilled - 1 })
  },

  async doCollage() {
    const valid = this.data.collageImages.filter(Boolean)
    if (valid.length < 2) { showToast('至少选择2张图片'); return }
    if (valid.length < this.data.collageImages.length) { showToast('请添加所有图片'); return }
    wx.showLoading({ title: '拼图中...', mask: true })
    try {
      const tempPath = await compositeCollage('stitchCanvas', valid, this.data.collageLayout)
      this.setData({ resultImages: [tempPath], animClass: 'anim-pop' })
      setTimeout(() => { if (this.data.animClass === 'anim-pop') this.setData({ animClass: '' }) }, 400)
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      showToast('拼图失败')
    }
  },

  async saveResult(e) {
    const url = e.currentTarget.dataset.src
    let filePath = url
    if (url.startsWith('http')) {
      try {
        const res = await new Promise((resolve, reject) => {
          wx.downloadFile({
            url,
            success: resolve,
            fail: reject
          })
        })
        filePath = res.tempFilePath
      } catch (err) {
        showToast('下载失败')
        return
      }
    }
    saveImage(filePath)
  },

  resetStitch() {
    this.setData({ resultImages: [] })
  },

  resetCollage() {
    this.setData({ resultImages: [] })
  },

  async chooseGrid9Image() {
    try {
      const paths = await chooseImage(1)
      if (paths.length) this.setData({ grid9Image: paths[0], grid9Result: [] })
    } catch (err) {}
  },

  async doGrid9Cut() {
    if (!this.data.grid9Image) return
    wx.showLoading({ title: '切图中...', mask: true })
    try {
      const results = await gridCut('grid9Canvas', this.data.grid9Image, 3, 3)
      const valid = results.filter(Boolean)
      if (valid.length === 0) { wx.hideLoading(); showToast('切图失败'); return }
      this.setData({ grid9Result: valid, animClass: 'anim-pop' })
      setTimeout(() => { if (this.data.animClass === 'anim-pop') this.setData({ animClass: '' }) }, 400)
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      showToast('切图失败')
    }
  },

  previewGrid9(e) {
    const url = this.data.grid9Result[e.currentTarget.dataset.index]
    if (!url) return
    wx.previewImage({ urls: [url], current: url })
  },

  async saveGrid9Results() {
    const urls = this.data.grid9Result.filter(Boolean)
    if (!urls.length) return
    wx.showLoading({ title: '保存中...', mask: true })
    let saved = 0
    for (const url of urls) {
      try { await saveImage(url); saved++ } catch (err) {}
    }
    wx.hideLoading()
    showToast(`已保存${saved}张`, 'success')
  },

  resetGrid9() {
    this.setData({ grid9Image: '', grid9Result: [] })
  },

  reset() {
    this.setData({
      mode: 'stitch',
      direction: 'vertical',
      images: [],
      resultImages: [],
      animClass: ''
    })
    this.updateSlots()
  }
})