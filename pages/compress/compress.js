const { chooseImage, saveImage, showToast, formatSize } = require('../../utils/util')
const { compressImage } = require('../../utils/canvas')
const ICONS = require('../../utils/icons')

Page({
  data: {
    sourceImage: '',
    quality: 80,
    formats: ['JPG', 'PNG', 'WebP'],
    formatIndex: 0,
    originalSize: '',
    resultSize: '',
    compressScale: '',
    resultImage: '',
    iconUpload: ICONS.upload
  },

  async chooseImage() {
    try {
      const paths = await chooseImage(1)
      if (paths.length) {
        const fs = wx.getFileSystemManager()
        const stat = fs.statSync(paths[0])
        this.setData({
          sourceImage: paths[0],
          originalSize: formatSize(stat.size),
          resultImage: '',
          resultSize: '',
          compressScale: ''
        })
      }
    } catch (err) {}
  },

  onQualityChange(e) { this.setData({ quality: e.detail.value }) },
  onQualityChanging(e) { this.setData({ quality: e.detail.value }) },
  onFormatChange(e) { this.setData({ formatIndex: parseInt(e.detail.value) }) },

  async doCompress() {
    if (!this.data.sourceImage) return
    wx.showLoading({ title: '压缩中...', mask: true })
    try {
      const tempPath = await compressImage(this.data.sourceImage, this.data.quality / 100)
      const fs = wx.getFileSystemManager()
      const stat = fs.statSync(tempPath)
      const orig = fs.statSync(this.data.sourceImage)
      const rate = ((1 - stat.size / orig.size) * 100).toFixed(0)
      this.setData({
        resultImage: tempPath,
        resultSize: formatSize(stat.size),
        compressScale: '-' + rate + '%'
      })
      wx.hideLoading()
      showToast('压缩完成', 'success')
    } catch (err) {
      wx.hideLoading()
      showToast('压缩失败')
    }
  },

  saveResult() { if (this.data.resultImage) saveImage(this.data.resultImage) },

  reset() {
    this.setData({
      sourceImage: '', quality: 80,
      originalSize: '', resultSize: '', compressScale: '', resultImage: ''
    })
  }
})
