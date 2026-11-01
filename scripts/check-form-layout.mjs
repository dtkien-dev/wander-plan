// Optional browser regression: NODE_PATH must resolve an installed Playwright; no app dependency is added.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { URL } from 'node:url'
import process from 'node:process'
import console from 'node:console'
const { chromium, webkit, devices } = createRequire(import.meta.url)('playwright')

const origin = process.argv[2] ?? 'http://127.0.0.1:5190/wander-plan/'
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname), 'Run against a local demo server only')
const sizes = [[320, 568], [375, 667], [390, 844], [844, 390], [390, 320], [768, 1024], [1280, 800]]

async function check(page, label) {
  await page.evaluate(() => globalThis.document.fonts.ready)
  const modal = page.getByRole('dialog')
  await modal.waitFor()
  // Finish the existing modal entrance transition before measuring its bounds.
  await modal.evaluate(async (element) => Promise.all(element.getAnimations().map((animation) => animation.finished)))
  const result = await modal.evaluate((element) => {
    const { document, innerWidth } = globalThis
    const rect = element.getBoundingClientRect()
    const controls = [...element.querySelectorAll('.field input:not([type=checkbox]):not([type=radio]), .field select, .field textarea')]
    return {
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      modalOverflow: element.scrollWidth > element.clientWidth,
      outside: controls.filter((control) => {
        const bounds = control.getBoundingClientRect()
        return bounds.left < rect.left || bounds.right > rect.right + 1 || bounds.width > control.parentElement.getBoundingClientRect().width + 1
      }).map((control) => control.getAttribute('type') ?? control.tagName),
      widths: controls.map((control) => [control.getBoundingClientRect().width, control.parentElement.getBoundingClientRect().width]),
      tooSmall: [...element.querySelectorAll('.form__actions button')].some((button) => button.getBoundingClientRect().height < 44),
      offscreenActions: [...element.querySelectorAll('.form__actions button')].some((button) => {
        const bounds = button.getBoundingClientRect()
        return bounds.top < 0 || bounds.bottom > globalThis.innerHeight + 1
      }),
      dateTypes: [...element.querySelectorAll('input[type=date], input[type=time]')].map((input) => [input.getAttribute('type'), input.type]),
    }
  })
  assert.equal(result.pageOverflow, false, `${label}: document overflow`)
  assert.equal(result.modalOverflow, false, `${label}: modal overflow`)
  assert.deepEqual(result.outside, [], `${label}: control outside its field`)
  assert.equal(result.tooSmall, false, `${label}: action smaller than44px`)
  assert.equal(result.offscreenActions, false, `${label}: action outside the viewport`)
  for (const [control, parent] of result.widths) assert.ok(Math.abs(control - parent) <= 1, `${label}: uneven full-width controls ${control}/${parent}`)
  return result.dateTypes
}

async function cancel(page) {
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click()
  const discard = page.getByRole('button', { name: 'Bỏ thay đổi', exact: true })
  if (await discard.isVisible()) await discard.click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
}

;(async () => {
  let cases = 0
  const dateSupport = {}
  for (const [engine, type] of Object.entries({ webkit, chromium })) {
    const browser = await type.launch({ headless: true })
    try {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({ ...devices['iPhone 13'], colorScheme: theme })
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.goto(`${origin}#/itinerary`)
        await page.getByText('Bản xem thử', { exact: true }).waitFor()
        for (const [width, height] of sizes) {
          await page.setViewportSize({ width, height })
          const label = `${engine}/${theme}/${width}x${height}`
          await page.getByRole('button', { name: 'Thêm địa điểm', exact: true }).click()
          dateSupport[engine] = await check(page, `${label}/itinerary`)
          await page.getByLabel('Tên địa điểm', { exact: true }).fill('Địa điểm rất dài '.repeat(20))
          await check(page, `${label}/long-title`)
          await page.getByLabel('Ghi chú', { exact: false }).fill('Ghi chú dài '.repeat(30))
          await page.getByLabel('Ghi chú', { exact: false }).focus()
          await check(page, `${label}/focused-notes`)
          await cancel(page)
          await page.getByRole('button', { name: 'Tạo chuyến mới', exact: true }).click()
          await check(page, `${label}/trip-create`)
          await cancel(page)
          cases += 4
        }
        await page.getByRole('link', { name: 'Chi phí', exact: true }).last().click()
        for (const [width, height] of sizes) {
          await page.setViewportSize({ width, height })
          const label = `${engine}/${theme}/${width}x${height}`
          await page.getByRole('button', { name: 'Thêm chi phí', exact: true }).click()
          // Stress a valid80-character member name without persisting any data.
          await page.locator('select[name="paidByUserId"]').evaluate((select) => { select.options[0].textContent = 'Tên thành viên rất dài '.repeat(4).slice(0, 80) })
          await page.getByLabel('Khoản chi', { exact: true }).fill('Kiểm tra tóm tắt')
          await page.locator('input[name="estimatedAmountVnd"]').fill('900000')
          await page.getByRole('radio', { name: 'Theo số tiền', exact: true }).check()
          await page.getByLabel('Số tiền của Bạn', { exact: true }).fill('500000')
          await page.getByLabel('Số tiền của Người bạn đồng hành', { exact: true }).fill('400000')
          const summary = page.getByRole('region', { name: 'Tóm tắt khoản chi' })
          assert.match(await summary.innerText(), /Dự kiến: Bạn thanh toán 900\.000/)
          assert.match(await summary.innerText(), /500\.000/)
          assert.match(await summary.innerText(), /400\.000/)
          await summary.locator('li span').last().evaluate((element) => { element.textContent = 'Tên người tham gia rất dài '.repeat(4).slice(0, 80) })
          await check(page, `${label}/expense-long-option-and-split`)
          await page.locator('select[name="paidByUserId"]').selectOption('demo-editor')
          assert.equal(await page.locator('select[name="paidByUserId"]').inputValue(), 'demo-editor')
          await cancel(page)
          cases += 1
        }
        await page.getByRole('link', { name: 'Nhóm', exact: true }).last().click()
        for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
          await page.setViewportSize({ width, height })
          for (const action of ['Chỉnh sửa chuyến', 'Thêm việc', 'Nhân bản chuyến', 'Dời ngày chuyến']) {
            await page.getByRole('button', { name: action, exact: true }).click()
            const select = page.getByRole('dialog').locator('select')
            if (await select.count()) {
              await select.evaluate((element) => { element.options[0].textContent = 'Tên người phụ trách rất dài '.repeat(3).slice(0, 80) })
              await select.focus()
              const ring = await select.evaluate((element) => globalThis.getComputedStyle(element.parentElement).outlineWidth)
              assert.ok(Number.parseFloat(ring) >= 2, 'Clipped select field must retain a visible focus ring')
            }
            await check(page, `${engine}/${theme}/${width}x${height}/${action}`)
            await cancel(page)
            cases += 1
          }
        }
        assert.deepEqual(errors, [], `${engine}/${theme}: browser errors`)
        await context.close()
        console.log(`${engine}/${theme}: layout and native-select interaction PASS`)
      }
    } finally { await browser.close() }
  }
  console.log(JSON.stringify({ cases, dateSupport, result: 'PASS', limit: 'Windows WebKit emulation is not physical iOS Safari or its native pickers/software keyboard.' }))
})().catch((error) => { console.error(error); process.exitCode = 1 })
