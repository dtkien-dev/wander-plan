// An .xlsx file is a ZIP archive. Reading its central directory before parsing rejects archives
// that declare far more data than a trip workbook needs, so a small file cannot expand into
// hundreds of megabytes in the browser. Declared sizes come from the file itself; the ZIP reader
// is expected to stop at them.
export const MAX_XLSX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024
export const MAX_XLSX_ENTRIES = 500

const END_OF_CENTRAL_DIRECTORY = 0x06054b50
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50
const invalidFile = 'File Excel không hợp lệ. Hãy dùng file .xlsx xuất từ WanderPlan hoặc Excel.'
const tooLarge = 'File Excel chứa quá nhiều dữ liệu sau khi giải nén. Hãy chia nhỏ file rồi thử lại.'

export function inspectXlsxArchive(buffer: ArrayBuffer) {
  const view = new DataView(buffer)
  const searchStart = Math.max(0, view.byteLength - 22 - 0xffff)
  let end = -1
  for (let offset = view.byteLength - 22; offset >= searchStart; offset -= 1) {
    if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY) { end = offset; break }
  }
  if (end < 0) throw new Error(invalidFile)

  const entries = view.getUint16(end + 10, true)
  const directorySize = view.getUint32(end + 12, true)
  const directoryOffset = view.getUint32(end + 16, true)
  // ZIP64 markers mean sizes beyond what a trip workbook can legitimately need.
  if (entries === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) throw new Error(tooLarge)
  if (entries > MAX_XLSX_ENTRIES) throw new Error(tooLarge)
  if (directoryOffset + directorySize > end) throw new Error(invalidFile)

  let offset = directoryOffset
  let total = 0
  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > end || view.getUint32(offset, true) !== CENTRAL_DIRECTORY_ENTRY) throw new Error(invalidFile)
    const uncompressed = view.getUint32(offset + 24, true)
    if (uncompressed === 0xffffffff) throw new Error(tooLarge)
    total += uncompressed
    if (total > MAX_XLSX_UNCOMPRESSED_BYTES) throw new Error(tooLarge)
    offset += 46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true)
  }
}
