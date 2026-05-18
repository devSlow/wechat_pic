function getCanvasById(canvasId, page) {
  return new Promise((resolve, reject) => {
    const query = page ? wx.createSelectorQuery().in(page) : wx.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec(res => {
        if (res && res[0]) {
          resolve(res[0])
        } else {
          reject(new Error('Canvas 未找到'))
        }
      })
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (typeof src === 'string' && src.startsWith('http')) {
      wx.getImageInfo({
        src,
        success(res) {
          resolve(res.path)
        },
        fail(err) {
          reject(err)
        }
      })
    } else {
      resolve(src)
    }
  })
}

function drawImageOnCanvas(canvasId, imagePath, destWidth, destHeight) {
  return getCanvasById(canvasId).then(({ node, width, height }) => {
    const ctx = node.getContext('2d')
    return loadImage(imagePath).then(localPath => {
      return new Promise((resolve, reject) => {
        const img = node.createImage()
        img.onload = () => {
          ctx.clearRect(0, 0, width, height)
          const scaleW = destWidth / img.width
          const scaleH = destHeight / img.height
          const scale = Math.min(scaleW, scaleH)
          const drawW = img.width * scale
          const drawH = img.height * scale
          const dx = (width - drawW) / 2
          const dy = (height - drawH) / 2
          ctx.drawImage(img, dx, dy, drawW, drawH)
          resolve({ ctx, node, width, height })
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = localPath
      })
    })
  })
}

function changeBgColor(canvasId, imagePath, color) {
  return getCanvasById(canvasId).then(({ node }) => {
    const ctx = node.getContext('2d')
    return loadImage(imagePath).then(localPath => {
      return new Promise((resolve, reject) => {
        const img = node.createImage()
        img.onload = () => {
          node.width = img.width
          node.height = img.height
          ctx.clearRect(0, 0, node.width, node.height)
          const scale = Math.max(node.width / img.width, node.height / img.height)
          const drawW = img.width * scale
          const drawH = img.height * scale
          const sx = (node.width - drawW) / 2
          const sy = (node.height - drawH) / 2
          ctx.drawImage(img, sx, sy, drawW, drawH)

          ctx.globalCompositeOperation = 'destination-over'
          ctx.fillStyle = color
          ctx.fillRect(0, 0, node.width, node.height)
          ctx.globalCompositeOperation = 'source-over'

          wx.canvasToTempFilePath({
            canvas: node,
            x: 0, y: 0,
            width: node.width, height: node.height,
            destWidth: node.width,
            destHeight: node.height,
            success(res) { resolve(res.tempFilePath) },
            fail(err) { reject(err) }
          })
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = localPath
      })
    })
  })
}

function compositeImages(canvasId, images, direction = 'vertical', targetWidth = 0, gap = 0, bgColor = '#FFFFFF') {
  return getCanvasById(canvasId).then(({ node }) => {
    const ctx = node.getContext('2d')

    function load(imgSrc) {
      return loadImage(imgSrc).then(localPath => {
        return new Promise(resolve => {
          const img = node.createImage()
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = localPath
        })
      })
    }

    return Promise.all(images.map(load)).then(loaded => {
      const validImages = loaded.filter(img => img !== null)
      if (validImages.length === 0) return Promise.reject(new Error('没有有效图片'))

      // 输出宽度：取所有图片最大宽度，保证清晰度
      const refW = Math.max(...validImages.map(i => i.width))

      let offset = 0
      const rects = validImages.map(img => {
        if (direction === 'vertical') {
          const drawW = refW
          const drawH = Math.round(img.height * refW / img.width)
          const r = { img, x: 0, y: offset, w: drawW, h: drawH }
          offset += drawH + gap
          return r
        } else {
          const refH = Math.max(...validImages.map(i => i.height))
          const drawH = refH
          const drawW = Math.round(img.width * refH / img.height)
          const r = { img, x: offset, y: 0, w: drawW, h: drawH }
          offset += drawW + gap
          return r
        }
      })

      const outW = direction === 'vertical' ? refW : offset - gap
      const outH = direction === 'vertical' ? offset - gap : Math.max(...validImages.map(i => i.height))

      node.width = outW
      node.height = outH
      ctx.clearRect(0, 0, outW, outH)
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, outW, outH)
      rects.forEach(r => ctx.drawImage(r.img, r.x, r.y, r.w, r.h))

      return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas: node,
          x: 0, y: 0,
          width: outW, height: outH,
          destWidth: outW,
          destHeight: outH,
          success(res) { resolve(res.tempFilePath) },
          fail(err) { reject(err) }
        })
      })
    })
  })
}

function compositeCollage(canvasId, images, layout) {
  return getCanvasById(canvasId).then(({ node }) => {
    const ctx = node.getContext('2d')
    const [cols, rows] = layout.split('x').map(Number)

    function load(imgSrc) {
      return loadImage(imgSrc).then(localPath => {
        return new Promise(resolve => {
          const img = node.createImage()
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = localPath
        })
      })
    }

    return Promise.all(images.map(load)).then(loaded => {
      const validImages = loaded.filter(img => img !== null)
      if (validImages.length === 0) return Promise.reject(new Error('没有有效图片'))

      // 根据图片尺寸计算合适的格子大小
      const maxImgW = Math.max(...validImages.map(i => i.width))
      const maxImgH = Math.max(...validImages.map(i => i.height))
      const cellSize = Math.max(maxImgW, maxImgH)

      const outW = cols * cellSize
      const outH = rows * cellSize

      node.width = outW
      node.height = outH
      ctx.clearRect(0, 0, outW, outH)

      validImages.forEach((img, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = col * cellSize
        const y = row * cellSize
        const scale = Math.max(cellSize / img.width, cellSize / img.height)
        const drawW = img.width * scale
        const drawH = img.height * scale
        const dx = x + (cellSize - drawW) / 2
        const dy = y + (cellSize - drawH) / 2
        ctx.drawImage(img, dx, dy, drawW, drawH)
      })

      return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas: node,
          x: 0, y: 0,
          width: outW, height: outH,
          destWidth: outW,
          destHeight: outH,
          success(res) { resolve(res.tempFilePath) },
          fail(err) { reject(err) }
        })
      })
    })
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function gridCut(canvasId, imagePath, cols, rows) {
  return getCanvasById(canvasId).then(({ node }) => {
    return loadImage(imagePath).then(localPath => {
      return new Promise((resolve, reject) => {
        const img = node.createImage()
        img.onload = async () => {
          try {
            const srcW = img.width
            const srcH = img.height
            const results = []

            // 主画布：绘制完整图片（与 Blue-IT-Tool 一致的 master canvas 做法）
            node.width = srcW
            node.height = srcH
            const ctx = node.getContext('2d')
            ctx.drawImage(img, 0, 0, srcW, srcH)
            await sleep(200)

            // 每个格子：创建独立离屏 Canvas，从主画布拷贝区域
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const sx = Math.floor(c * srcW / cols)
                const sy = Math.floor(r * srcH / rows)
                const ex = Math.floor((c + 1) * srcW / cols)
                const ey = Math.floor((r + 1) * srcH / rows)
                const cellW = ex - sx
                const cellH = ey - sy

                const offCanvas = wx.createOffscreenCanvas({ type: '2d', width: cellW, height: cellH })
                const offCtx = offCanvas.getContext('2d')
                offCtx.drawImage(node, sx, sy, cellW, cellH, 0, 0, cellW, cellH)

                const tempPath = await new Promise((res, rej) => {
                  wx.canvasToTempFilePath({
                    canvas: offCanvas,
                    x: 0, y: 0,
                    width: cellW, height: cellH,
                    destWidth: cellW, destHeight: cellH,
                    fileType: 'jpg',
                    quality: 0.9,
                    success(result) { res(result.tempFilePath) },
                    fail(err) { rej(err) }
                  })
                })
                results.push(tempPath)
              }
            }

            resolve(results)
          } catch (err) {
            reject(err)
          }
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = localPath
      })
    })
  })
}

function drawWatermark(canvasId, imagePath, options) {
  return getCanvasById(canvasId).then(({ node }) => {
    return loadImage(imagePath).then(localPath => {
      return new Promise((resolve, reject) => {
        const img = node.createImage()
        img.onload = () => {
          node.width = img.width
          node.height = img.height
          const ctx = node.getContext('2d')
          const width = img.width
          const height = img.height

          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          ctx.font = `${options.fontSize}px ${options.fontFamily || 'sans-serif'}`
          ctx.fillStyle = options.color || '#FFFFFF'
          ctx.globalAlpha = options.opacity
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          const angle = (options.angle || 0) * Math.PI / 180

          if (options.tiled) {
            // 铺满模式
            const tw = ctx.measureText(options.text).width + 80
            const th = options.fontSize * 3
            ctx.save()
            ctx.translate(width / 2, height / 2)
            ctx.rotate(angle)
            ctx.translate(-width / 2, -height / 2)
            for (let y = -height; y < height * 2; y += th) {
              for (let x = -width; x < width * 2; x += tw) {
                ctx.fillText(options.text, x + tw / 2, y + th / 2)
              }
            }
            ctx.restore()
          } else {
            // 单个水印
            ctx.save()
            ctx.translate(width / 2, height / 2)
            ctx.rotate(angle)
            ctx.fillText(options.text, 0, 0)
            ctx.restore()
          }

          ctx.globalAlpha = 1

          wx.canvasToTempFilePath({
            canvas: node,
            x: 0, y: 0,
            width: width,
            height: height,
            destWidth: width,
            destHeight: height,
            success(res) { resolve(res.tempFilePath) },
            fail(err) { reject(err) }
          })
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = localPath
      })
    })
  })
}

function exportToFile(tempPath, format = 'png') {
  return new Promise((resolve, reject) => {
    const ext = format === 'jpg' ? 'jpg' : 'png'
    const savePath = `${wx.env.USER_DATA_PATH}/export_${Date.now()}.${ext}`
    const fs = wx.getFileSystemManager()
    fs.copyFile({
      srcPath: tempPath,
      destPath: savePath,
      success() { resolve(savePath) },
      fail(err) { reject(err) }
    })
  })
}

function createLayout(canvasId, imagePath, spec, layoutInfo, page) {
  return getCanvasById(canvasId, page).then(({ node }) => {
    const outW = 1800
    const outH = 1200
    node.width = outW
    node.height = outH
    const ctx = node.getContext('2d')
    return loadImage(imagePath).then(localPath => {
      return new Promise((resolve, reject) => {
        const img = node.createImage()
        img.onload = () => {
          const { cols, rows } = layoutInfo
          const gap = 15
          const cellW = spec.pxW
          const cellH = spec.pxH
          const totalW = cols * cellW + gap * (cols - 1)
          const totalH = rows * cellH + gap * (rows - 1)
          const ox = Math.round((outW - totalW) / 2)
          const oy = Math.round((outH - totalH) / 2)

          ctx.clearRect(0, 0, outW, outH)
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, outW, outH)

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const x = Math.round(ox + c * (cellW + gap))
              const y = Math.round(oy + r * (cellH + gap))
              ctx.drawImage(img, x, y, cellW, cellH)
            }
          }

          wx.canvasToTempFilePath({
            canvas: node,
            x: 0, y: 0,
            width: outW, height: outH,
            destWidth: outW, destHeight: outH,
            success(res) { resolve(res.tempFilePath) },
            fail(err) { reject(err) }
          })
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = localPath
      })
    })
  })
}

function compressImage(tempFilePath, quality, format) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: tempFilePath,
      quality: Math.round(quality * 100),
      success(res) {
        resolve(res.tempFilePath)
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

function convertFormat(tempFilePath, format) {
  return new Promise((resolve, reject) => {
    getCanvasById('convertCanvas').then(({ node }) => {
      return loadImage(tempFilePath).then(localPath => {
        return new Promise((resolve2, reject2) => {
          const img = node.createImage()
          img.onload = () => {
            node.width = img.width
            node.height = img.height
            const ctx = node.getContext('2d')
            ctx.clearRect(0, 0, img.width, img.height)
            
            // JPG不支持透明度，需要白色背景
            if (format === 'jpg') {
              ctx.fillStyle = '#FFFFFF'
              ctx.fillRect(0, 0, img.width, img.height)
            }
            
            ctx.drawImage(img, 0, 0, img.width, img.height)
            
            // 微信只支持 jpg 和 png
            const fileType = format === 'jpg' ? 'jpeg' : 'png'
            
            wx.canvasToTempFilePath({
              canvas: node,
              x: 0, y: 0,
              width: img.width,
              height: img.height,
              destWidth: img.width,
              destHeight: img.height,
              fileType: fileType,
              quality: 0.9,
              success(res) { resolve2(res.tempFilePath) },
              fail(err) { reject2(err) }
            })
          }
          img.onerror = () => reject2(new Error('图片加载失败'))
          img.src = localPath
        })
      })
    }).then(r => resolve(r), e => reject(e))
  })
}

function renderIdPhoto(canvasId, imagePath, color, spec) {
  return getCanvasById(canvasId).then(({ node }) => {
    return loadImage(imagePath).then(localPath => {
      return new Promise((resolve, reject) => {
        const img = node.createImage()
        img.onload = () => {
          // 用原图尺寸渲染，保留所有细节
          node.width = img.width
          node.height = img.height
          const ctx = node.getContext('2d')
          ctx.clearRect(0, 0, img.width, img.height)

          // 填充背景色
          ctx.fillStyle = color
          ctx.fillRect(0, 0, img.width, img.height)

          // 居中绘制人物
          const scale = Math.max(img.width / img.width, img.height / img.height)
          const drawW = img.width * scale
          const drawH = img.height * scale
          const sx = (img.width - drawW) / 2
          const sy = (img.height - drawH) / 2
          ctx.drawImage(img, sx, sy, drawW, drawH)

          wx.canvasToTempFilePath({
            canvas: node,
            x: 0, y: 0,
            width: img.width, height: img.height,
            destWidth: spec.pxW, destHeight: spec.pxH,
            success(res) { resolve(res.tempFilePath) },
            fail(err) { reject(err) }
          })
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = localPath
      })
    })
  })
}

module.exports = {
  getCanvasById,
  loadImage,
  drawImageOnCanvas,
  changeBgColor,
  renderIdPhoto,
  compositeImages,
  compositeCollage,
  gridCut,
  drawWatermark,
  exportToFile,
  createLayout,
  compressImage,
  convertFormat
}
