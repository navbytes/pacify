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
        alert('Error saving script. Please try again.')
        break
      default:
        alert('An error occurred. Please try again.')
        break
    }
  }

  public static alert(message: ALERT_TYPES): void {
    alert(message)
  }
}
