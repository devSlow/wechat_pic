const app = getApp()

function getRemoveBgUrl() {
  return getServiceConfigValue('removeBgUrl')
}

function getVerifyBaseUrl() {
  return getServiceConfigValue('verifyBaseUrl')
}

function getConvertUrl() {
  return getServiceConfigValue('convertUrl')
}

function getServiceConfigValue(key) {
  const serviceConfig = app.globalData.serviceConfig || {}
  return serviceConfig[key] || ''
}

function parseJsonSafely(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function isApiSuccess(data) {
  const status = data && data.status
  return status === true || status === 1 || status === '1' || status === 'true'
}

function getApiErrorMessage(data, fallback) {
  if (!data) return fallback
  return data.error || data.message || data.detail || fallback
}

function uploadFile(options) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: options.url,
      filePath: options.filePath,
      name: options.name || 'file',
      formData: options.formData || {},
      timeout: options.timeout || 60000,
      success(res) {
        resolve(res)
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

function verifyRequest(options) {
  return new Promise((resolve, reject) => {
    const verifyBaseUrl = getVerifyBaseUrl()
    if (!verifyBaseUrl) {
      reject(new Error('验证码服务未配置'))
      return
    }

    wx.request({
      url: verifyBaseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json'
      },
      timeout: 5000,
      success(res) {
        if (res.data && (res.data.code === 0 || res.data.code === 200)) {
          resolve(res.data.data)
        } else {
          reject(res.data || {})
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

const verify = {
  getCode(sessionId) {
    return verifyRequest({
      url: `/verify/code?sessionId=${encodeURIComponent(sessionId)}`,
      method: 'GET'
    })
  }
}

function removeBg(filePath, width = 295, height = 413) {
  return new Promise((resolve, reject) => {
    const removeBgUrl = getRemoveBgUrl()
    if (!removeBgUrl) {
      reject(new Error('抠图服务未配置'))
      return
    }

    console.log('[removeBg] 开始上传, filePath:', filePath, 'size:', width, 'x', height)
    wx.showLoading({ title: '处理中...', mask: true })
    let done = false

    const task = wx.uploadFile({
      url: `${removeBgUrl}/idphoto`,
      filePath,
      name: 'input_image',
      formData: {
        width: String(width),
        height: String(height),
        dpi: '300',
        hd: 'true',
        human_matting_model: 'modnet_photographic_portrait_matting',
        face_detect_model: 'mtcnn',
        face_alignment: 'true'
      },
      timeout: 120000,
      success(res) {
        if (done) return; done = true
        if (res.statusCode !== 200) {
          wx.hideLoading()
          reject(new Error('抠图失败: ' + res.statusCode))
          return
        }
        try {
          const data = parseJsonSafely(res.data)
          console.log('[removeBg] 抠图响应:', data)
          if (!data || !isApiSuccess(data)) {
            wx.hideLoading()
            reject(new Error(getApiErrorMessage(data, '抠图失败')))
            return
          }
          const stdBase64 = data.image_base64_standard || data.image_base64
          const hdBase64 = data.image_base64_hd
          if (!stdBase64) {
            wx.hideLoading()
            reject(new Error('抠图结果无效'))
            return
          }
          const fs = wx.getFileSystemManager()
          const transparentPath = `${wx.env.USER_DATA_PATH}/idphoto_transparent_${Date.now()}.png`
          const stdClean = stdBase64.replace(/^data:image\/\w+;base64,/, '')
          fs.writeFile({
            filePath: transparentPath,
            data: stdClean,
            encoding: 'base64',
            success() {
              if (!hdBase64) {
                wx.hideLoading()
                resolve({ transparentPath, transparentHDPath: '' })
                return
              }
              const hdClean = hdBase64.replace(/^data:image\/\w+;base64,/, '')
              const transparentHDPath = `${wx.env.USER_DATA_PATH}/idphoto_transparent_hd_${Date.now()}.png`
              fs.writeFile({
                filePath: transparentHDPath,
                data: hdClean,
                encoding: 'base64',
                success() {
                  wx.hideLoading()
                  resolve({ transparentPath, transparentHDPath })
                },
                fail() {
                  wx.hideLoading()
                  resolve({ transparentPath, transparentHDPath: '' })
                }
              })
            },
            fail(err) {
              wx.hideLoading()
              reject(new Error('保存失败'))
            }
          })
        } catch (err) {
          wx.hideLoading()
          reject(new Error('解析响应失败'))
        }
      },
      fail(err) {
        if (done) return; done = true
        wx.hideLoading()
        reject(new Error('网络请求失败'))
      }
    })
    setTimeout(() => {
      if (done) return; done = true
      task.abort()
      wx.hideLoading()
      reject(new Error('服务暂不可用'))
    }, 60000)
  })
}

function addBackground(filePath, color) {
  return new Promise((resolve, reject) => {
    const removeBgUrl = getRemoveBgUrl()
    if (!removeBgUrl) {
      reject(new Error('抠图服务未配置'))
      return
    }

    console.log('[addBackground] 添加背景色:', color)
    wx.uploadFile({
      url: `${removeBgUrl}/add_background`,
      filePath,
      name: 'input_image',
      formData: { color: color },
      timeout: 60000,
      success(res) {
        if (res.statusCode === 200) {
          try {
            const data = parseJsonSafely(res.data)
            console.log('[addBackground] 响应:', data)
            if (data && isApiSuccess(data) && data.image_base64) {
              const base64 = data.image_base64.replace(/^data:image\/\w+;base64,/, '')
              const fs = wx.getFileSystemManager()
              const bgPath = `${wx.env.USER_DATA_PATH}/idphoto_bg_${Date.now()}.jpg`
              fs.writeFile({
                filePath: bgPath,
                data: base64,
                encoding: 'base64',
                success() {
                  console.log('[addBackground] 保存完成:', bgPath)
                  resolve(bgPath)
                },
                fail(err) {
                  reject(new Error('保存失败'))
                }
              })
            } else {
              reject(new Error(getApiErrorMessage(data, '添加背景色失败')))
            }
          } catch (err) {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error('添加背景色失败: ' + res.statusCode))
        }
      },
      fail(err) {
        reject(new Error('网络请求失败'))
      }
    })
  })
}

function compressImageByApi(filePath, kb = 100, dpi = 300) {
  console.log('[compressImageByApi] 开始压缩, filePath:', filePath, 'kb:', kb, 'dpi:', dpi)
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().stat({
      path: filePath,
      success(stat) {
        const fileBytes = stat.size
        console.log('[compressImageByApi] 原图大小:', fileBytes, 'bytes')
        // 原图已经小于目标大小，直接返回原图
        if (fileBytes <= kb * 1024) {
          console.log('[compressImageByApi] 原图已满足要求，无需压缩')
          resolve(filePath)
          return
        }
        doCompress(filePath, kb, dpi, resolve, reject)
      },
      fail() {
        doCompress(filePath, kb, dpi, resolve, reject)
      }
    })
  })
}

function doCompress(filePath, kb, dpi, resolve, reject) {
  const removeBgUrl = getRemoveBgUrl()
  if (!removeBgUrl) {
    reject(new Error('压缩服务未配置'))
    return
  }

  wx.uploadFile({
    url: `${removeBgUrl}/set_kb`,
    filePath,
    name: 'input_image',
    formData: {
      kb: String(kb),
      dpi: String(dpi)
    },
    timeout: 60000,
    success(res) {
      console.log('[compressImageByApi] 服务器响应:', res.statusCode, res.data)
      if (res.statusCode === 200) {
        try {
          const data = parseJsonSafely(res.data)
          console.log('[compressImageByApi] 解析结果:', data.status, 'hasBase64:', !!data.image_base64)
            if (data && isApiSuccess(data) && data.image_base64) {
            // 将 base64 保存为临时文件
            const fs = wx.getFileSystemManager()
            const tempPath = `${wx.env.USER_DATA_PATH}/compress_${Date.now()}.jpg`
            const cleanBase64 = data.image_base64.replace(/^data:image\/\w+;base64,/, '')
            console.log('[compressImageByApi] 保存临时文件:', tempPath)
            fs.writeFile({
              filePath: tempPath,
              data: cleanBase64,
              encoding: 'base64',
              success() {
                console.log('[compressImageByApi] 临时文件保存成功:', tempPath)
                resolve(tempPath)
              },
              fail(err) {
                console.log('[compressImageByApi] 保存临时文件失败:', err)
                reject(new Error('保存压缩图片失败'))
              }
            })
          } else if (data && data.error) {
            console.log('[compressImageByApi] 服务器返回错误:', data.error)
            reject(new Error(data.error))
          } else {
            console.log('[compressImageByApi] 无效响应格式')
            reject(new Error('压缩结果无效'))
          }
        } catch (err) {
          console.log('[compressImageByApi] 解析响应失败:', err)
          reject(new Error('解析响应失败'))
        }
      } else {
        console.log('[compressImageByApi] HTTP错误:', res.statusCode)
        reject(new Error('压缩失败: ' + (res.statusCode || 'unknown')))
      }
    },
    fail(err) {
      console.log('[compressImageByApi] 网络请求失败:', err)
      reject(new Error('网络请求失败'))
    }
  })
}

function convertImageByApi(filePath, format) {
  console.log('[convertImageByApi] 开始转换, filePath:', filePath, 'format:', format)
  return new Promise((resolve, reject) => {
    const convertUrl = getConvertUrl()
    if (!convertUrl) {
      reject(new Error('转换服务未配置'))
      return
    }

    wx.uploadFile({
      url: convertUrl,
      filePath,
      name: 'file',
      formData: {
        format: format
      },
      timeout: 60000,
      success(res) {
        console.log('[convertImageByApi] 服务器响应:', res.statusCode, res.data)
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data && data.status && data.url) {
              console.log('[convertImageByApi] 转换成功:', data.url)
              resolve(data.url)
            } else if (data && data.error) {
              reject(new Error(data.error))
            } else {
              reject(new Error('转换结果无效'))
            }
          } catch (err) {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error('转换失败: ' + (res.statusCode || 'unknown')))
        }
      },
      fail(err) {
        console.log('[convertImageByApi] 网络请求失败:', err)
        reject(new Error('网络请求失败'))
      }
    })
  })
}

function generateLayoutPhoto(filePath, width, height, color, isHD = false) {
  console.log('[generateLayoutPhoto] 生成排版照, w:', width, 'h:', height, 'color:', color, 'hd:', isHD)
  return new Promise(async (resolve, reject) => {
    const removeBgUrl = getRemoveBgUrl()
    if (!removeBgUrl) {
      reject(new Error('排版服务未配置'))
      return
    }

    wx.showLoading({ title: '排版中...', mask: true })
    try {
      const bgPath = await addBackground(filePath, color.replace('#', ''))
      wx.uploadFile({
        url: `${removeBgUrl}/generate_layout_photos`,
        filePath: bgPath,
        name: 'input_image',
        formData: {
          height: String(height),
          width: String(width),
        },
        timeout: 60000,
        success(res) {
          wx.hideLoading()
          if (res.statusCode === 200) {
            try {
              const data = parseJsonSafely(res.data)
              if (data && isApiSuccess(data) && data.image_base64) {
                const clean = data.image_base64.replace(/^data:image\/\w+;base64,/, '')
                const outPath = `${wx.env.USER_DATA_PATH}/layout_${Date.now()}.jpg`
                wx.getFileSystemManager().writeFile({
                  filePath: outPath,
                  data: clean,
                  encoding: 'base64',
                  success() { resolve(outPath) },
                  fail() { reject(new Error('保存排版照失败')) }
                })
              } else {
                reject(new Error(getApiErrorMessage(data, '排版失败')))
              }
            } catch (e) {
              reject(new Error('解析排版响应失败'))
            }
          } else {
            reject(new Error('排版接口不可用'))
          }
        },
        fail(err) {
          wx.hideLoading()
          reject(new Error('网络请求失败'))
        }
      })
    } catch (err) {
      wx.hideLoading()
      reject(err)
    }
  })
}

module.exports = {
  removeBg,
  addBackground,
  generateLayoutPhoto,
  compressImageByApi,
  convertImageByApi,
  uploadFile,
  getRemoveBgUrl,
  getVerifyBaseUrl,
  getConvertUrl,
  verify
}
