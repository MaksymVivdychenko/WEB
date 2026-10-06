export class TimeUtils {
  /**
   * Formats a date to 24-hour time with seconds: "HH:mm:ss" (Ukraine time: Europe/Kyiv)
   */
  static formatTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('uk-UA', {
      timeZone: 'Europe/Kyiv',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }
}
