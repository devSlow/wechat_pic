const { chooseImage, saveImage, showToast } = require('../../utils/util')
const { convertFormat } = require('../../utils/canvas')
const ICONS = require('../../utils/icons')

Page({
  data: {
    sourceImage: '',
    targetFormat: 'png',
    resultImage: '',
    iconUpload: ICONS.upload
  },

  async chooseImage() {
    try {
      const paths = await chooseImage(1)
      if (paths.length) this.setData({ sourceImage: paths[0], resultImage: '' })
    } catch (err) {}
  },

  selectFormat(e) {
    this.setData({ targetFormat: e.currentTarget.dataset.format })
  },

  async doConvert() {
    if (!this.data.sourceImage) return
    wx.showLoading({ title: '转换中...', mask: true })
    try {
      const path = await convertFormat(this.data.sourceImage, this.data.targetFormat)
      this.setData({ resultImage: path })
      wx.hideLoading()
      showToast('转换完成', 'success')
    } catch (err) {
      wx.hideLoading()
      showToast('转换失败')
    }
  },

  saveResult() { if (this.data.resultImage) saveImage(this.data.resultImage) },

  reset() {
    this.setData({ sourceImage: '', targetFormat: 'png', resultImage: '' })
  }
})
