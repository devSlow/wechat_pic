const { SIZES, getLayout } = require('../../utils/idphoto-sizes')
const { removeBg } = require('../../utils/api')
const { chooseImage, saveImage, showToast } = require('../../utils/util')
const canvasUtil = require('../../utils/canvas')

const DOT_COLORS = ['#3B82F6', '#7C3AED', '#059669', '#EA580C', '#DB2777']

function assignColors(list) {
  return list.map((s, i) => ({ ...s, color: DOT_COLORS[i] }))
}

Page({
  data: {
    screen: 'spec',
    bgColors: [
      { name: '蓝色', value: '#4A90FF' },
      { name: '白色', value: '#FFFFFF' },
      { name: '红色', value: '#ED1C24' },
      { name: '浅蓝', value: '#5BAFDB' },
      { name: '深蓝', value: '#1E3A5F' },
      { name: '灰色', value: '#CCCCCC' },
      { name: '浅粉', value: '#FFDAD8' },
      { name: '浅黄', value: '#FEF7C6' },
      { name: '浅绿', value: '#D1F0DC' },
      { name: '浅紫', value: '#E4D7F3' },
      { name: '青绿', value: '#C0E8E7' },
      { name: '淡蓝', value: '#D0DDF5' }
    ],
    SIZES,
    quickSpecs: assignColors(SIZES.common.slice(0, 5)),
    currentSizes: assignColors(SIZES.common),
    selectedSpec: null,
    selectedColor: '#FFFFFF',
    sourceImagePath: '',
    previewPath: '',
    transparentPath: '',
    transparentHDPath: '',
    needsColorRender: true,
    isHD: true,
    specTab: 'common',
    currentSpecTab: 'common',
    showSizePanel: false,
    canLayout: false,
    layoutDesc: '',
    isLayout: false,
    layoutPath: '',
    layoutFromServer: false,
    previewWidth: 0,
    previewHeight: 0,
  },

  onLoad() {
    // preview dimensions computed in wxml via inline style
  },

  calcPreviewSize(spec) {
    if (!spec || !spec.pxW || !spec.pxH) return { w: 280, h: 392 }
    const maxW = 320, maxH = 420
    const ratio = spec.pxW / spec.pxH
    let w, h
    if (ratio >= 1) {
      w = maxW
      h = Math.round(w / ratio)
      if (h > maxH) { h = maxH; w = Math.round(h * ratio) }
    } else {
      h = maxH
      w = Math.round(h * ratio)
      if (w > maxW) { w = maxW; h = Math.round(w / ratio) }
    }
    return { w: Math.round(w), h: Math.round(h) }
  },

  async pickQuickSpec(e) {
    const item = e.currentTarget.dataset.item
    const { w, h } = this.calcPreviewSize(item)
    this.setData({ selectedSpec: item, specTab: 'common', currentSpecTab: 'common', previewWidth: w, previewHeight: h })
  },

  async pickSpec(e) {
    const item = e.currentTarget.dataset.item
    const tab = e.currentTarget.dataset.tab || 'common'
    const { w, h } = this.calcPreviewSize(item)
    this.setData({ selectedSpec: item, specTab: tab, currentSpecTab: tab, showSizePanel: false, previewWidth: w, previewHeight: h })
  },

  switchSpecTab(e) {
    const tab = e.currentTarget.dataset.tab
    const sizes = tab === 'common' ? assignColors(SIZES.common)
      : tab === 'exam' ? assignColors(SIZES.exam)
      : assignColors(SIZES.visa)
    this.setData({ specTab: tab, currentSizes: sizes })
  },

  showSizePanel() { this.setData({ showSizePanel: true }) },
  hideSizePanel() { this.setData({ showSizePanel: false }) },

  async takePhoto() {
    if (!this.data.selectedSpec) { showToast('请先选择规格'); return }
    try {
      const paths = await chooseImage(1, true)
      if (paths && paths.length) this.startProcessing(paths[0])
    } catch (err) {}
  },

  async choosePhoto() {
    if (!this.data.selectedSpec) { showToast('请先选择规格'); return }
    try {
      const paths = await chooseImage(1)
      if (paths && paths.length) this.startProcessing(paths[0])
    } catch (err) {}
  },

  async renderBg(srcPath, color, spec) {
    return canvasUtil.renderIdPhoto('layoutCanvas', srcPath, color, spec)
  },

  async startProcessing(imagePath) {
    this.setData({ sourceImagePath: imagePath, screen: 'processing' })
    console.log('[idphoto] startProcessing, 图片路径:', imagePath, '规格:', this.data.selectedSpec)

    try {
      const spec = this.data.selectedSpec
      const result = await removeBg(imagePath, spec.pxW, spec.pxH)
      console.log('[idphoto] 抠图完成, transparent:', result.transparentPath, 'hd:', result.transparentHDPath)

      wx.showLoading({ title: '渲染中...', mask: true })
      const initialSrcPath = this.data.isHD && result.transparentHDPath ? result.transparentHDPath : result.transparentPath
      const bgPath = await this.renderBg(initialSrcPath, this.data.selectedColor, spec)
      wx.hideLoading()

      const layout = getLayout(spec)
      const { w, h } = this.calcPreviewSize(spec)
      this.setData({
        transparentPath: result.transparentPath,
        transparentHDPath: result.transparentHDPath || result.transparentPath,
        previewPath: bgPath,
        needsColorRender: false,
        isLayout: false,
        layoutPath: '',
        canLayout: !!layout,
        layoutDesc: layout ? layout.paperSize + '相纸排' + layout.count + '张' : '',
        previewWidth: w,
        previewHeight: h,
        screen: 'result'
      })
      console.log('[idphoto] 切换到结果页, spec:', spec.name)
    } catch (err) {
      wx.hideLoading()
      console.log('[idphoto] 处理失败:', err.message)
      showToast(err.message || '处理失败')
      this.setData({ screen: 'spec' })
    }
  },

  async exportSave() {
    const { previewPath, isLayout, layoutPath, needsColorRender, selectedColor, isHD, transparentPath, transparentHDPath, selectedSpec } = this.data
    if (!previewPath) return
    try {
      let path = isLayout && layoutPath ? layoutPath : previewPath
      if (!isLayout && needsColorRender) {
        const srcPath = isHD && transparentHDPath ? transparentHDPath : transparentPath
        path = await this.renderBg(srcPath, selectedColor, selectedSpec)
        this.setData({ previewPath: path, needsColorRender: false })
      }
      await saveImage(path)
      showToast('已保存', 'success')
    } catch (err) {
      showToast('保存失败')
    }
  },

  async toggleView() {
    const { isLayout, selectedSpec, selectedColor, transparentPath, transparentHDPath, isHD, previewPath, needsColorRender } = this.data
    if (!selectedSpec) return

    if (isLayout) {
      this.setData({ isLayout: false, layoutPath: '' })
      return
    }

    const layout = getLayout(selectedSpec)
    if (!layout) { showToast('该规格不支持排版'); return }

    try {
      wx.showLoading({ title: '排版中...', mask: true })
      const srcPath = isHD && transparentHDPath ? transparentHDPath : transparentPath
      const bgPath = needsColorRender
        ? await this.renderBg(srcPath, selectedColor, selectedSpec)
        : previewPath

      this.setData({ isLayout: true, layoutPath: '' })

      const tempPath = await canvasUtil.createLayout('layoutCanvas', bgPath, selectedSpec, layout, this)
      wx.hideLoading()
      this.setData({
        layoutPath: tempPath,
        layoutFromServer: false,
        layoutDesc: layout.paperSize + '相纸排' + layout.count + '张'
      })
    } catch (err) {
      wx.hideLoading()
      console.log('[idphoto] 排版失败:', err)
      this.setData({ isLayout: false })
      showToast('排版失败')
    }
  },

  async retake() {
    this.setData({
      previewPath: '',
      transparentPath: '',
      transparentHDPath: '',
      isLayout: false,
      layoutPath: ''
    })
    try {
      const paths = await chooseImage(1)
      if (paths && paths.length) this.startProcessing(paths[0])
      else this.setData({ screen: 'spec' })
    } catch (err) {
      this.setData({ screen: 'spec' })
    }
  },

  async changeBgColor(e) {
    const color = e.currentTarget.dataset.color
    if (color === this.data.selectedColor) return
    this.setData({ selectedColor: color })

    if (this.data.screen !== 'result') return
    const { isHD, transparentPath, transparentHDPath, isLayout } = this.data
    const srcPath = isHD && transparentHDPath ? transparentHDPath : transparentPath
    if (!srcPath) { showToast('透明底图不存在'); return }

    try {
      const bgPath = await this.renderBg(srcPath, color, this.data.selectedSpec)

      if (isLayout) {
        this.setData({ isLayout: false, layoutPath: '' })
      }

      this.setData({ previewPath: bgPath, needsColorRender: false })
    } catch (err) {
      showToast('更新失败')
    }
  },

  async toggleHD(e) {
    const hd = e.detail.value
    this.setData({ isHD: hd })
    if (this.data.screen === 'result' && this.data.transparentPath) {
      const srcPath = hd && this.data.transparentHDPath ? this.data.transparentHDPath : this.data.transparentPath
      try {
        const bgPath = await this.renderBg(srcPath, this.data.selectedColor, this.data.selectedSpec)
        this.setData({ previewPath: bgPath, needsColorRender: false })
      } catch (err) {}
    }
  },

  reset() {
    this.setData({
      screen: 'spec',
      sourceImagePath: '',
      previewPath: '',
      transparentPath: '',
      transparentHDPath: '',
      isHD: false,
      selectedSpec: null,
      selectedColor: '#FFFFFF',
      canLayout: false,
      layoutDesc: '',
      isLayout: false,
      layoutPath: ''
    })
  }
})
