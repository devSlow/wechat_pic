function formatTime(date) {
  const d = date || new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function formatSize(bytes) {
  if (!bytes) return '0B'
  const units = ['B', 'KB', 'MB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(1) + units[i]
}

function chooseImage(count = 1, useCamera = false) {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count,
      sizeType: ['original', 'compressed'],
      sourceType: useCamera ? ['camera'] : ['album', 'camera'],
      success(res) {
        resolve(res.tempFilePaths)
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

function saveImage(tempFilePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success(res) {
        wx.showToast({ title: '已保存', icon: 'success' })
        resolve(res)
      },
      fail(err) {
        if (err.errMsg.includes('deny') || err.errMsg.includes('not authorized')) {
          wx.showModal({
            title: '提示',
            content: '需要开启保存到相册的权限',
            success(m) {
              if (m.confirm) wx.openSetting()
            }
          })
        }
        reject(err)
      }
    })
  })
}

function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 })
}

module.exports = {
  formatTime,
  formatSize,
  chooseImage,
  saveImage,
  showToast
}
