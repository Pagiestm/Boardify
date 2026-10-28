"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSignIcon,
  BellIcon,
  CalendarClockIcon,
  MessageSquareIcon,
  UserPlusIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { TimeAgo } from "@/components/time-ago";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { NotificationType } from "../types";
import { describeNotification } from "../utils";
import { useDesktopNotifications } from "../hooks/use-desktop-notifications";
import { useGetNotifications } from "../api/use-get-notifications";
import { useMarkNotificationsRead } from "../api/use-mark-notifications-read";

const ICONS = {
  [NotificationType.ASSIGNED]: UserPlusIcon,
  [NotificationType.MENTIONED]: AtSignIcon,
  [NotificationType.COMMENTED]: MessageSquareIcon,
  [NotificationType.DUE_SOON]: CalendarClockIcon,
};

export const NotificationsButton = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data } = useGetNotifications();
  const { mutate: markRead } = useMarkNotificationsRead();

  const unread = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  useDesktopNotifications(data?.notifications);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={unread > 0 ? `Notifications (${unread} non lues)` : "Notifications"}
        >
          <BellIcon />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="xs" onClick={() => markRead({ json: {} })}>
              Tout marquer comme lu
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Aucune notification pour le moment.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {notifications.map((notification) => {
              const Icon = ICONS[notification.type];

              return (
                <li key={notification.$id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!notification.read) markRead({ json: { ids: [notification.$id] } });
                      setOpen(false);
                      router.push(
                        `/workspaces/${notification.workspaceId}/tasks/${notification.taskId}`,
                      );
                    }}
                    className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[13px] leading-snug",
                          notification.read && "text-muted-foreground",
                        )}
                      >
                        {describeNotification(
                          notification.type,
                          notification.actorName ?? "Quelqu'un",
                          notification.taskName,
                        )}
                      </span>
                      <TimeAgo
                        date={notification.$createdAt}
                        className="text-[11px] text-muted-foreground"
                      />
                    </span>
                    {!notification.read && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};
