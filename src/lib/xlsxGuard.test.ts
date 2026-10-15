import { describe, expect, it } from 'vitest'
import writeXlsxFile from 'write-excel-file/node'
import { inspectXlsxArchive, MAX_XLSX_UNCOMPRESSED_BYTES } from './xlsxGuard'

async function workbook() {
  const buffer = await writeXlsxFile([{ sheet: 'ChiPhi', data: [['Khoản chi'], ['Ăn tối']] }]).toBuffer()
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

function firstCentralEntry(view: DataView) {
  for (let offset = 0; offset < view.byteLength - 4; offset += 1) {
    if (view.getUint32(offset, true) === 0x02014b50) return offset
  }
  throw new Error('no central directory entry')
}

describe('xlsx archive guard', () => {
  it('accepts a normal workbook', async () => {
    const buffer = await workbook()
    expect(() => inspectXlsxArchive(buffer)).not.toThrow()
  })

  it('rejects an archive that declares too much uncompressed data', async () => {
    const buffer = await workbook()
    const view = new DataView(buffer)
    view.setUint32(firstCentralEntry(view) + 24, MAX_XLSX_UNCOMPRESSED_BYTES + 1, true)
    expect(() => inspectXlsxArchive(buffer)).toThrow('quá nhiều dữ liệu')
  })

  it('rejects ZIP64 size markers and files that are not ZIP archives', async () => {
    const buffer = await workbook()
    const view = new DataView(buffer)
    view.setUint32(firstCentralEntry(view) + 24, 0xffffffff, true)
    expect(() => inspectXlsxArchive(buffer)).toThrow('quá nhiều dữ liệu')
    expect(() => inspectXlsxArchive(new TextEncoder().encode('not a workbook').buffer as ArrayBuffer)).toThrow('không hợp lệ')
  })
})
