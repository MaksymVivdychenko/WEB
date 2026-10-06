export class IdUtils {
  /**
   * Generates a unique collision-resistant ID with a given prefix
   */
  static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
}
