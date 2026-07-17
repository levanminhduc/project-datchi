export function openRouteInTab(path: string): void {
  const win = window.open('', `tab:${path}`)
  if (!win) return
  if (win.location.href === 'about:blank' || win.location.pathname !== path) {
    win.location.href = path
  }
  win.focus()
}
