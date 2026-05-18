let privateServiceConfig = {}

try {
  privateServiceConfig = require('./config/service.private')
} catch (_error) {
  privateServiceConfig = {}
}

App({
  globalData: {
    openid: '',
    serviceConfig: {
      removeBgUrl: '',
      verifyBaseUrl: '',
      convertUrl: ''
    }
  },

  onLaunch() {
    const that = this
    const storedServiceConfig = wx.getStorageSync('serviceConfig') || {}

    that.globalData.serviceConfig = {
      ...that.globalData.serviceConfig,
      ...privateServiceConfig,
      ...storedServiceConfig,
    }

    wx.getStorage({
      key: 'openid',
      success(res) {
        that.globalData.openid = res.data
      }
    })
  },

  onShow(options) {
    if (options.scene) {
      const scene = decodeURIComponent(options.scene)
      if (scene.includes('sessionId=')) {
        wx.navigateTo({
          url: '/pages/verify/verify?scene=' + encodeURIComponent(scene)
        })
        return
      }
      if (scene === 'print_upload') {
        // 检查是否已选择区域
        const selectedRegion = wx.getStorageSync('selectedRegion')
        if (selectedRegion) {
          wx.navigateTo({ 
            url: `/pages/print-upload/print-upload?regionCode=${selectedRegion.code}&regionName=${encodeURIComponent(selectedRegion.name)}` 
          })
        } else {
          wx.navigateTo({ url: '/pages/region-select/region-select' })
        }
      }
    }
  }
})
