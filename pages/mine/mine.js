Page({
  data: {},

  copyEmail() {
    wx.setClipboardData({
      data: 'contact@example.com',
      success() {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        })
      }
    })
  },

  openAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    })
  },

  openPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  },

  openVerify() {
    wx.navigateTo({
      url: '/pages/verify/verify'
    })
  }
})
