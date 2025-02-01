export enum ERROR_TYPES {
  EDITOR = 'editor_error',
  VALIDATION = 'validation_error',
  INITIALIZATION = 'Initialization failed',
  SET_PROXY = 'Error setting proxy',
  CLEAR_PROXY = 'Error clearing proxy',
  UPDATE_BADGE = 'Error updating badge',
  SET_POPUP = 'Failed to set popup',
  BACKUP = 'Backup failed',
  DRAG_START = 'Error during dragstart',
  DROP = 'Error handling drop',
  SAVE_SETTINGS = 'Error saving settings',
  FETCH_SETTINGS = 'Error fetching settings',
  LOAD_SETTINGS = 'Error loading settings',
  SAVE_SCRIPT = 'Error saving script',
  DELETE_SCRIPT = 'Error deleting script',
  ACTION_CLICK = 'Error handling action click',
}

export enum ALERT_TYPES {
  BACKUP_SUCCESS = 'Settings have been backed up successfully!',
  BACKUP_FAILURE = 'Backup failed. Please try again.',
  RESTORE_SUCCESS = 'Settings have been restored successfully!',
}
