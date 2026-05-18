const { chooseImage, saveImage, showToast } = require('../../utils/util')
const { drawWatermark } = require('../../utils/canvas')
const { compressImageByApi, convertImageByApi } = require('../../utils/api')
const app = getApp()

Page({
  data: {
    mode: 'compress',
    primary: '#2563EB',

    // 压缩
    compressImages: [],
    compressOriginalSizes: [],
    compressOriginalBytes: [],
    compressTargetKb: 100,
    compressUnit: 'KB',
    compressDisplayValue: '100KB',
    sliderMin: 10,
    sliderMax: 500,
    sliderStep: 10,
    preset1: 50,
    preset2: 100,
    preset3: 200,
    preset4: 300,
    preset1Label: '50KB',
    preset2Label: '100KB',
    preset3Label: '200KB',
    preset4Label: '300KB',
    compressResults: [],
    compressResultSizes: [],
    compressRates: [],
    compressCount: 0,
    compressSuccessRate: '0%',

    // 水印
    watermarkImage: '',
    watermarkText: '',
    watermarkColor: '#FFFFFF',
    watermarkOpacity: 85,
    watermarkAngle: -30,
    watermarkFontSize: 36,
    watermarkPreview: '',

    // 转换
    convertImages: [],
    convertOriginalFormats: [],
    convertCount: 0,
    convertFormat: '',
    allPng: false,
    allJpg: false,
    allWebp: false,
    allBmp: false,
    allTiff: false,
  },

  onLoad() {
    this.setData({ primary: app.globalData?.primary || '#2563EB' })
  },

  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode })
  },

  // ===== 压缩 =====
  async chooseCompressImage() {
    try {
      const paths = await chooseImage(9)
      if (paths.length) {
        const images = [...this.data.compressImages, ...paths].slice(0, 9)
        const sizes = []
        const bytesArr = []
        for (const path of paths) {
          const size = await this.getFileSize(path)
          sizes.push(this.formatSize(size))
          bytesArr.push(size)
        }
        const originalSizes = [...this.data.compressOriginalSizes, ...sizes].slice(0, 9)
        const originalBytes = [...this.data.compressOriginalBytes, ...bytesArr].slice(0, 9)
        
        // 根据最大图片大小自动判断单位
        const maxBytes = Math.max(...originalBytes)
        const maxMb = maxBytes / (1024 * 1024)
        let unit, targetKb, sliderMin, sliderMax, sliderStep
        let preset1, preset2, preset3, preset4
        let preset1Label, preset2Label, preset3Label, preset4Label

        if (maxMb >= 2) {
          // 大图用MB
          unit = 'MB'
          targetKb = Math.max(1, Math.floor(maxMb / 2))
          sliderMin = 1
          sliderMax = Math.min(50, Math.ceil(maxMb))
          sliderStep = 1
          preset1 = 1
          preset2 = 2
          preset3 = 5
          preset4 = 10
          preset1Label = '1MB'
          preset2Label = '2MB'
          preset3Label = '5MB'
          preset4Label = '10MB'
        } else {
          // 小图用KB
          unit = 'KB'
          targetKb = 100
          sliderMin = 10
          sliderMax = Math.min(2000, Math.ceil(maxBytes / 1024))
          sliderStep = 10
          preset1 = 50
          preset2 = 100
          preset3 = 200
          preset4 = 500
          preset1Label = '50KB'
          preset2Label = '100KB'
          preset3Label = '200KB'
          preset4Label = '500KB'
        }

        this.setData({
          compressImages: images,
          compressOriginalSizes: originalSizes,
          compressOriginalBytes: originalBytes,
          compressCount: images.length,
          compressResults: [],
          compressResultSizes: [],
          compressRates: [],
          compressUnit: unit,
          compressTargetKb: targetKb,
          compressDisplayValue: targetKb + unit,
          sliderMin,
          sliderMax,
          sliderStep,
          preset1, preset2, preset3, preset4,
          preset1Label, preset2Label, preset3Label, preset4Label
        })
      }
    } catch (err) {
      console.log('[chooseCompressImage] 失败:', err)
    }
  },

  removeCompressImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = [...this.data.compressImages]
    const sizes = [...this.data.compressOriginalSizes]
    images.splice(idx, 1)
    sizes.splice(idx, 1)
    this.setData({
      compressImages: images,
      compressOriginalSizes: sizes,
      compressCount: images.length,
      compressResults: [],
      compressResultSizes: [],
      compressRates: []
    })
  },

  clearCompressImages() {
    this.setData({
      compressImages: [],
      compressOriginalSizes: [],
      compressResults: [],
      compressResultSizes: [],
      compressRates: [],
      compressCount: 0
    })
  },

  clearCompressResults() {
    this.setData({
      compressResults: [],
      compressResultSizes: [],
      compressRates: [],
      compressSuccessRate: '0%'
    })
  },

  setTargetKb(e) {
    this.setData({ 
      compressTargetKb: Number(e.currentTarget.dataset.kb),
      compressDisplayValue: e.currentTarget.dataset.kb + this.data.compressUnit
    })
  },

  onTargetKbInput(e) {
    this.setData({ 
      compressTargetKb: e.detail.value,
      compressDisplayValue: e.detail.value + this.data.compressUnit
    })
  },

  setCompressUnit(e) {
    const unit = e.currentTarget.dataset.unit
    if (unit === this.data.compressUnit) return
    if (unit === 'MB') {
      this.setData({ compressUnit: 'MB', compressTargetKb: 1 })
    } else {
      this.setData({ compressUnit: 'KB', compressTargetKb: 100 })
    }
  },

  async doCompress() {
    if (!this.data.compressImages.length) return
    wx.showLoading({ title: '压缩中...', mask: true })
    const results = []
    const resultSizes = []
    const rates = []
    const total = this.data.compressImages.length
    const targetKb = this.data.compressUnit === 'MB' ? this.data.compressTargetKb * 1024 : this.data.compressTargetKb

    for (let i = 0; i < total; i++) {
      wx.showLoading({ title: `压缩中 ${i + 1}/${total}`, mask: true })
      try {
        const resultUrl = await compressImageByApi(
          this.data.compressImages[i],
          targetKb
        )
        results.push(resultUrl)
        const originalSize = this.data.compressOriginalBytes[i]
        // 原图已满足目标，显示提示而非数值
        if (resultUrl === this.data.compressImages[i]) {
          resultSizes.push('不需要压缩')
          rates.push('0%')
        } else {
          resultSizes.push(this.data.compressDisplayValue)
          const targetSize = targetKb * 1024
          const rate = originalSize > 0 ? Math.round((1 - targetSize / originalSize) * 100) : 0
          rates.push(Math.max(0, rate) + '%')
        }
      } catch (err) {
        console.log('[compress] 失败:', i, err)
        results.push('')
        resultSizes.push('失败')
        rates.push('0%')
      }
    }

    this.setData({
      compressResults: results,
      compressResultSizes: resultSizes,
      compressRates: rates,
      compressSuccessRate: Math.round(results.filter(Boolean).length / total * 100) + '%'
    })
    wx.hideLoading()
    const successCount = results.filter(Boolean).length
    showToast(`完成 ${successCount}/${total}`, 'success')
  },

  async saveCompressResult(e) {
    const idx = e.currentTarget.dataset.index
    const url = this.data.compressResults[idx]
    if (!url) return
    try {
      let filePath = url
      // 如果是远程URL，先下载
      if (filePath.startsWith('http')) {
        const res = await new Promise((resolve, reject) => {
          wx.downloadFile({ url: filePath, success: resolve, fail: reject })
        })
        filePath = res.tempFilePath
      }
      await saveImage(filePath)
      showToast('已保存', 'success')
    } catch (err) {
      showToast('保存失败')
    }
  },

  async saveAllCompressResults() {
    const results = this.data.compressResults.filter(Boolean)
    if (!results.length) return
    wx.showLoading({ title: '保存中...', mask: true })

    // 检查权限
    try {
      await new Promise((resolve, reject) => {
        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: resolve,
          fail: () => reject(new Error('需要相册权限'))
        })
      })
    } catch (err) {
      wx.hideLoading()
      wx.showModal({
        title: '提示',
        content: '需要开启保存到相册的权限',
        success(m) { if (m.confirm) wx.openSetting() }
      })
      return
    }

    let saved = 0
    for (let i = 0; i < results.length; i++) {
      wx.showLoading({ title: `保存中 ${i + 1}/${results.length}`, mask: true })
      try {
        let filePath = results[i]
        // 如果是远程URL，先下载
        if (filePath.startsWith('http')) {
          const res = await new Promise((resolve, reject) => {
            wx.downloadFile({ url: filePath, success: resolve, fail: reject })
          })
          filePath = res.tempFilePath
        }
        await saveImage(filePath)
        saved++
      } catch (err) {
        console.log('[saveAll] 保存失败:', i, err)
      }
    }
    wx.hideLoading()
    showToast(`已保存${saved}张`, 'success')
  },

  // ===== 水印 =====
  async chooseWatermarkImage() {
    try {
      const paths = await chooseImage(1)
      if (paths.length) {
        this.setData({ watermarkImage: paths[0] })
        this.updateWatermarkPreview()
      }
    } catch (err) {}
  },

  removeWatermarkImage() {
    this.setData({ watermarkImage: '', watermarkPreview: '' })
  },

  onWatermarkTextChange(e) {
    this.setData({ watermarkText: e.detail.value })
    this.updateWatermarkPreview()
  },

  setFontSize(e) {
    this.setData({ watermarkFontSize: Number(e.currentTarget.dataset.size) })
    this.updateWatermarkPreview()
  },

  onOpacityInput(e) {
    this.setData({ watermarkOpacity: e.detail.value })
  },

  onOpacityChange(e) {
    this.setData({ watermarkOpacity: e.detail.value })
    this.updateWatermarkPreview()
  },

  onAngleInput(e) {
    this.setData({ watermarkAngle: e.detail.value })
  },

  onAngleChange(e) {
    this.setData({ watermarkAngle: e.detail.value })
    this.updateWatermarkPreview()
  },

  onFontSizeInput(e) {
    this.setData({ watermarkFontSize: e.detail.value })
  },

  onFontSizeChange(e) {
    this.setData({ watermarkFontSize: e.detail.value })
    this.updateWatermarkPreview()
  },

  setWatermarkColor(e) {
    this.setData({ watermarkColor: e.currentTarget.dataset.color })
    this.updateWatermarkPreview()
  },

  async updateWatermarkPreview() {
    if (!this.data.watermarkImage || !this.data.watermarkText) {
      this.setData({ watermarkPreview: '' })
      return
    }
    try {
      const result = await drawWatermark('watermarkCanvas', this.data.watermarkImage, {
        text: this.data.watermarkText,
        fontSize: this.data.watermarkFontSize,
        opacity: this.data.watermarkOpacity / 100,
        color: this.data.watermarkColor,
        tiled: true,
        angle: this.data.watermarkAngle
      })
      this.setData({ watermarkPreview: result })
    } catch (err) {
      console.log('[watermark] 预览失败:', err)
    }
  },

  async doWatermark() {
    if (!this.data.watermarkImage || !this.data.watermarkText) return
    wx.showLoading({ title: '添加水印中...', mask: true })
    try {
      const result = await drawWatermark('watermarkCanvas', this.data.watermarkImage, {
        text: this.data.watermarkText,
        fontSize: this.data.watermarkFontSize,
        opacity: this.data.watermarkOpacity / 100,
        color: this.data.watermarkColor,
        tiled: true,
        angle: this.data.watermarkAngle
      })
      wx.hideLoading()
      await saveImage(result)
      showToast('已保存', 'success')
    } catch (err) {
      wx.hideLoading()
      console.log('[watermark] 失败:', err)
      showToast('添加水印失败')
    }
  },

  // ===== 转换 =====
  async chooseConvertImage() {
    try {
      const paths = await chooseImage(9)
      if (paths.length) {
        const images = [...this.data.convertImages, ...paths].slice(0, 9)
        const formats = []
        for (const path of paths) {
          const format = this.getFileExtension(path).toLowerCase()
          formats.push(format.toUpperCase())
        }
        const originalFormats = [...this.data.convertOriginalFormats, ...formats].slice(0, 9)
        
        // 检查是否所有图片都是同一格式
        const allFormats = originalFormats.map(f => f.toLowerCase())
        const allPng = allFormats.length > 0 && allFormats.every(f => f === 'png')
        const allJpg = allFormats.length > 0 && allFormats.every(f => f === 'jpg' || f === 'jpeg')
        const allWebp = allFormats.length > 0 && allFormats.every(f => f === 'webp')
        const allBmp = allFormats.length > 0 && allFormats.every(f => f === 'bmp')
        const allTiff = allFormats.length > 0 && allFormats.every(f => f === 'tiff' || f === 'tif')
        
        this.setData({
          convertImages: images,
          convertOriginalFormats: originalFormats,
          convertCount: images.length,
          allPng,
          allJpg,
          allWebp,
          allBmp,
          allTiff
        })
      }
    } catch (err) {}
  },

  removeConvertImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = [...this.data.convertImages]
    const formats = [...this.data.convertOriginalFormats]
    images.splice(idx, 1)
    formats.splice(idx, 1)
    
    // 重新计算格式过滤
    const allFormats = formats.map(f => f.toLowerCase())
    const allPng = allFormats.length > 0 && allFormats.every(f => f === 'png')
    const allJpg = allFormats.length > 0 && allFormats.every(f => f === 'jpg' || f === 'jpeg')
    const allWebp = allFormats.length > 0 && allFormats.every(f => f === 'webp')
    const allBmp = allFormats.length > 0 && allFormats.every(f => f === 'bmp')
    const allTiff = allFormats.length > 0 && allFormats.every(f => f === 'tiff' || f === 'tif')
    
    this.setData({
      convertImages: images,
      convertOriginalFormats: formats,
      convertCount: images.length,
      allPng,
      allJpg,
      allWebp,
      allBmp,
      allTiff
    })
  },

  clearConvertImages() {
    this.setData({
      convertImages: [],
      convertOriginalFormats: [],
      convertCount: 0,
      convertFormat: '',
      allPng: false,
      allJpg: false,
      allWebp: false,
      allBmp: false,
      allTiff: false
    })
  },

  setConvertFormat(e) {
    this.setData({ convertFormat: e.currentTarget.dataset.format })
  },

  async doConvert() {
    if (!this.data.convertImages.length || !this.data.convertFormat) return
    wx.showLoading({ title: '转换中...', mask: true })
    const total = this.data.convertImages.length
    let saved = 0

    for (let i = 0; i < total; i++) {
      wx.showLoading({ title: `转换中 ${i + 1}/${total}`, mask: true })
      try {
        const result = await convertImageByApi(this.data.convertImages[i], this.data.convertFormat)
        let filePath = result
        // 如果是远程URL，先下载
        if (result.startsWith('http')) {
          const res = await new Promise((resolve, reject) => {
            wx.downloadFile({ url: result, success: resolve, fail: reject })
          })
          filePath = res.tempFilePath
        }
        await saveImage(filePath)
        saved++
      } catch (err) {
        console.log('[convert] 失败:', i, err)
      }
    }

    wx.hideLoading()
    showToast(`已保存${saved}张`, 'success')
  },

  // ===== 工具函数 =====
  getImageInfo(filePath) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: filePath,
        success: resolve,
        fail: reject
      })
    })
  },

  getFileSize(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileInfo({
        filePath,
        success(res) {
          resolve(res.size || 0)
        },
        fail(err) {
          console.log('[getFileSize] 失败:', err)
          resolve(0)
        }
      })
    })
  },

  formatSize(bytes) {
    if (!bytes) return '0B'
    const units = ['B', 'KB', 'MB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024
      i++
    }
    return size.toFixed(1) + units[i]
  },

  parseSize(str) {
    const match = str.match(/([\d.]+)(B|KB|MB)/)
    if (!match) return 0
    const num = parseFloat(match[1])
    const unit = match[2]
    if (unit === 'MB') return num * 1024 * 1024
    if (unit === 'KB') return num * 1024
    return num
  },

  getFileExtension(filePath) {
    const parts = filePath.split('.')
    return parts.length > 1 ? parts[parts.length - 1] : 'unknown'
  }
})
