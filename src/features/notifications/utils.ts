import { NotificationType } from "./types";

export const describeNotification = (type: NotificationType, actor: string, task: string) => {
  switch (type) {
    case NotificationType.ASSIGNED:
      return `${actor} vous a assigné « ${task} »`;
    case NotificationType.MENTIONED:
      return `${actor} vous a mentionné dans « ${task} »`;
    case NotificationType.COMMENTED:
      return `${actor} a commenté « ${task} »`;
    case NotificationType.DUE_SOON:
      return `« ${task} » arrive à échéance demain`;
  }
};
