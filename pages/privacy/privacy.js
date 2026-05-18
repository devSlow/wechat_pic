Page({
  data: {
    loaded: false
  },

  onLoad() {
    setTimeout(() => {
      this.setData({ loaded: true })
    }, 100)
  }
})
