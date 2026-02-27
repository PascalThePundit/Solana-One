import { useAppStore, AppNotification, NotificationType } from '../store/useAppStore';

export const notificationEngine = {
  createAlert(type: NotificationType, title: string, message: string, priority: 0 | 1 | 2) {
    const { addNotification } = useAppStore.getState();
    addNotification({ type, title, message, priority });
  },

  getPrioritizedAlerts(): AppNotification[] {
    const { notifications } = useAppStore.getState();
    // Sort by priority (desc) then timestamp (desc)
    return [...notifications].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  },

  getGroupedAlerts() {
    const { notifications } = useAppStore.getState();
    const lowRiskAlerts = notifications.filter(n => n.priority === 0 && !n.isRead);
    
    if (lowRiskAlerts.length > 3) {
      return {
        isGrouped: true,
        count: lowRiskAlerts.length,
        summary: `You have ${lowRiskAlerts.length} routine updates.`
      };
    }
    
    return { isGrouped: false };
  }
};
