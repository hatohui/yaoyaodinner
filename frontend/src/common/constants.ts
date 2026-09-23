export const THEME_STORAGE_KEY = 'theme'
export const PIN_STORAGE_KEY = 'event_pin'
export const EVENT_ID_STORAGE_KEY = 'event_id'
export const GUEST_NAME_STORAGE_KEY = 'guest_name'
export const ACTIVE_TABLE_ID_STORAGE_KEY = 'active_table_id'
export const WHOAMI_STORAGE_KEY = 'whoami_by_table'
export const TABLE_TAB_STORAGE_KEY = 'table_tab_by_id'
export const ADMIN_PASSPHRASE_STORAGE_KEY = 'admin_passphrase'
export const ADMIN_EVENT_ID_STORAGE_KEY = 'admin_event_id'
export const ADMIN_EDIT_MODE_STORAGE_KEY = 'admin_edit_mode'
export const ADMIN_SIDEBAR_COLLAPSED_STORAGE_KEY = 'admin_sidebar_collapsed'

export const ADMIN_HEADER = 'x-admin-secret'
export const ADMIN_GATE_TAPS = 5
export const ADMIN_GATE_WINDOW_MS = 1500

export const STALE_TIME_STATIC = 1000 * 60 * 30

export const MENU_PAGE_SIZE_OPTIONS = [8, 12, 16, 24] as const
export const MENU_PAGE_SIZE_ALL = 500

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
]
