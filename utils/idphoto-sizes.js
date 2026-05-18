const SIZES = {
  common: [
    { name: '一寸', mmW: 25, mmH: 35, pxW: 295, pxH: 413, desc: '学生证、工作证、简历' },
    { name: '小一寸', mmW: 22, mmH: 32, pxW: 260, pxH: 378, desc: '驾驶证' },
    { name: '大一寸', mmW: 33, mmH: 48, pxW: 390, pxH: 567, desc: '护照、港澳通行证' },
    { name: '二寸', mmW: 35, mmH: 49, pxW: 413, pxH: 579, desc: '毕业证、学位证' },
    { name: '小二寸', mmW: 35, mmH: 45, pxW: 413, pxH: 531, desc: '公务员考试、司法考试' },
    { name: '大二寸', mmW: 35, mmH: 53, pxW: 413, pxH: 626, desc: '毕业照' },
    { name: '身份证', mmW: 26, mmH: 32, pxW: 358, pxH: 441, desc: '身份证' },
    { name: '社保卡', mmW: 26, mmH: 32, pxW: 358, pxH: 441, desc: '社保卡' },
    { name: '简历照', mmW: 25, mmH: 35, pxW: 295, pxH: 413, desc: '简历' },
    { name: '学生证', mmW: 25, mmH: 35, pxW: 295, pxH: 413, desc: '学生证' },
    { name: '健康证', mmW: 25, mmH: 35, pxW: 295, pxH: 413, desc: '健康证' },
    { name: '教师资格证', mmW: 25, mmH: 35, pxW: 295, pxH: 413, desc: '教师资格证' },
    { name: '驾驶证', mmW: 22, mmH: 32, pxW: 260, pxH: 378, desc: '驾驶证' },
    { name: '一寸半身照', mmW: 25, mmH: 35, pxW: 295, pxH: 413, desc: '半身照' },
    { name: '二寸半身照', mmW: 35, mmH: 49, pxW: 413, pxH: 579, desc: '半身照' }
  ],
  exam: [
    { name: '教师资格证(笔试)', pxW: 150, pxH: 200, bg: '白', maxSize: '200K' },
    { name: '教师资格证(认定)', pxW: 295, pxH: 413, bg: '白', maxSize: '190K' },
    { name: '国考/省考', pxW: 413, pxH: 531, bg: '蓝/白', maxSize: '20-200K' },
    { name: '考研', pxW: 480, pxH: 640, bg: '白/蓝', maxSize: '10M' },
    { name: '四六级', pxW: 144, pxH: 192, bg: '浅蓝', maxSize: '8-20K' },
    { name: '普通话测试', pxW: 390, pxH: 567, bg: '白/蓝' },
    { name: '计算机等级', pxW: 144, pxH: 192, bg: '浅蓝', maxSize: '20-200K' },
    { name: '国家公务员(一寸)', pxW: 295, pxH: 413, bg: '蓝/白' },
    { name: '国家公务员(小二寸)', pxW: 413, pxH: 531, bg: '蓝/白' },
    { name: '执业医师', pxW: 413, pxH: 531, bg: '白/蓝' },
    { name: '护士资格证', pxW: 413, pxH: 531, bg: '白/蓝' },
    { name: '注册会计师', pxW: 295, pxH: 413, bg: '白/蓝' },
    { name: '执业药师', pxW: 413, pxH: 579, bg: '白/蓝' },
    { name: '雅思考试', pxW: 390, pxH: 567, bg: '白' },
    { name: '高考报名', pxW: 390, pxH: 567, bg: '蓝' },
    { name: '学信网', pxW: 480, pxH: 640, bg: '蓝' },
    { name: '成人自考', pxW: 295, pxH: 413, bg: '蓝/白' },
    { name: '中级会计职称', pxW: 295, pxH: 413, bg: '白/蓝' },
    { name: '社会工作者', pxW: 295, pxH: 413, bg: '白/蓝' },
    { name: '初级护师', pxW: 295, pxH: 413, bg: '白/蓝' },
    { name: '主管护师', pxW: 295, pxH: 413, bg: '白/蓝' },
    { name: '育婴师', pxW: 413, pxH: 531, bg: '白/蓝' }
  ],
  visa: [
    { name: '美国签证', mmW: 51, mmH: 51, pxW: 591, pxH: 591, bg: '白' },
    { name: '美国护照', mmW: 51, mmH: 51, pxW: 600, pxH: 600, bg: '白' },
    { name: '日本签证', mmW: 45, mmH: 45, pxW: 531, pxH: 531, bg: '白' },
    { name: '申根签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '英国签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '加拿大签证', mmW: 35, mmH: 45, pxW: 420, pxH: 540, bg: '白' },
    { name: '澳大利亚签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '新西兰签证', mmW: 76, mmH: 102, pxW: 900, pxH: 1200, bg: '白' },
    { name: '新加坡签证', mmW: 34, mmH: 44, pxW: 400, pxH: 514, bg: '白' },
    { name: '泰国签证', mmW: 40, mmH: 60, pxW: 472, pxH: 709, bg: '白' },
    { name: '韩国签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '法国签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '德国签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '意大利签证', mmW: 35, mmH: 40, pxW: 413, pxH: 472, bg: '白' },
    { name: '西班牙签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '俄罗斯签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '印度签证', mmW: 51, mmH: 51, pxW: 591, pxH: 591, bg: '白' },
    { name: '越南签证', mmW: 40, mmH: 60, pxW: 472, pxH: 709, bg: '白' },
    { name: '菲律宾签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '马来西亚签证', mmW: 35, mmH: 50, pxW: 413, pxH: 590, bg: '白' },
    { name: '印度尼西亚签证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' },
    { name: '中国护照', mmW: 33, mmH: 48, pxW: 390, pxH: 567, bg: '白' },
    { name: '港澳通行证', mmW: 33, mmH: 48, pxW: 390, pxH: 567, bg: '白' },
    { name: '台湾通行证', mmW: 33, mmH: 48, pxW: 390, pxH: 567, bg: '白' },
    { name: '入台证', mmW: 35, mmH: 45, pxW: 413, pxH: 531, bg: '白' }
  ]
}

const BG_COLORS = [
  { name: '红色', value: '#ED1C24' },
  { name: '蓝色', value: '#4A90FF' },
  { name: '白色', value: '#FFFFFF' }
]

const LAYOUT_PAPER = { pxW: 1800, pxH: 1200, name: '6寸' }
const LAYOUT_GAP = 15
const LAYOUT_MIN_MARGIN = 10

function getLayout(spec) {
  if (!spec || !spec.pxW || !spec.pxH) return null

  const PW = LAYOUT_PAPER.pxW, PH = LAYOUT_PAPER.pxH
  const G = LAYOUT_GAP
  const M = LAYOUT_MIN_MARGIN

  const maxCols = Math.max(1, Math.floor((PW - 2 * M + G) / (spec.pxW + G)))
  const maxRows = Math.max(1, Math.floor((PH - 2 * M + G) / (spec.pxH + G)))

  let best = null
  for (let cols = 1; cols <= maxCols; cols++) {
    for (let rows = 1; rows <= maxRows; rows++) {
      const totalW = cols * spec.pxW + G * (cols - 1)
      const totalH = rows * spec.pxH + G * (rows - 1)
      const hMargin = Math.floor((PW - totalW) / 2)
      const vMargin = Math.floor((PH - totalH) / 2)
      if (hMargin >= M && vMargin >= M) {
        const area = cols * rows
        const waste = (PW - totalW) + (PH - totalH)
        if (!best || area > best.area || (area === best.area && waste < best.waste)) {
          best = { cols, rows, area, waste, hMargin, vMargin }
        }
      }
    }
  }

  if (best) {
    return { cols: best.cols, rows: best.rows, count: best.area, paperSize: LAYOUT_PAPER.name }
  }

  const fallbackCols = Math.max(1, Math.floor((PW - 2 * M) / (spec.pxW + G)))
  const fallbackRows = Math.max(1, Math.floor((PH - 2 * M) / (spec.pxH + G)))
  if (fallbackCols > 0 && fallbackRows > 0) {
    return { cols: fallbackCols, rows: fallbackRows, count: fallbackCols * fallbackRows, paperSize: LAYOUT_PAPER.name }
  }

  return null
}

module.exports = { SIZES, BG_COLORS, getLayout }
