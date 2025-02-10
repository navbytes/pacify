import { ALERT_TYPES } from '../interfaces/error'
import { ERROR_TYPES } from '@/interfaces'

export class NotifyService {
  public static error(type: ERROR_TYPES, error: any, context = ''): void {
    console.error(context, type, error)

    switch (type) {
      case ERROR_TYPES.BACKUP:
        NotifyService.alert(ALERT_TYPES.BACKUP_FAILURE)
        break
      case ERROR_TYPES.SAVE_SCRIPT:
        NotifyService.alert(ALERT_TYPES.SAVE_FAILURE)
        break
      default:
        NotifyService.alert(ALERT_TYPES.UNKNOWN_ERROR)
        break
    }
  }

  public static alert(message: ALERT_TYPES | string): void {
    alert(message)
  }
}
