export type DebounceTimeout = ReturnType<typeof setTimeout> | null

/**
 * Represents the type of the list view.
 * this is used to determine the type of list view to render.
 * - `POPUP`: The list view is rendered in a popup.
 * - `OPTIONS`: The list view is rendered in the options page.
 * - `QUICK_SWITCH`: The list view is rendered in the quick switch list in popup page.
 */
export type ListViewType = 'POPUP' | 'OPTIONS' | 'QUICK_SWITCH'

export interface DropItem {
  dataType: string
  dataId: string
}
