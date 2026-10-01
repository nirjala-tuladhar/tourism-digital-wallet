import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2 } from "lucide-react";
import { ApiClientError } from "../../api/client";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/ToastProvider";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useNotifications";
import { formatRelativeTime } from "../../lib/date";

export function NotificationMenu() {
  const navigate = useNavigate();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const removeNotification = useDeleteNotification();
  const pushToast = useToast();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const unreadCount = data?.unreadCount ?? 0;

  const openNotification = async (id: string, read: boolean, tripId?: string, itemId?: string) => {
    if (!read) {
      await markRead.mutateAsync(id);
    }

    setOpen(false);

    if (!tripId) {
      return;
    }

    const params = new URLSearchParams({ trip: tripId });

    if (itemId) {
      params.set("item", itemId);
    }

    navigate(`/trips?${params.toString()}`);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-xl border border-slate-200 bg-amber-50 p-2 text-amber-700 transition hover:border-amber-200 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Notifications</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">
                {unreadCount === 0 ? "All caught up" : `${unreadCount} unread`}
              </p>
            </div>
            <button
              type="button"
              disabled={unreadCount === 0 || markAll.isPending}
              onClick={() => markAll.mutate()}
              className="text-xs font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading || (isFetching && !data) ? (
              <div className="space-y-3 px-4 py-4" aria-hidden="true">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : null}

            {isError ? (
              <div className="space-y-2 px-4 py-5">
                <p className="text-sm text-rose-700">
                  {error instanceof ApiClientError
                    ? error.message
                    : "Unable to load notifications."}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : null}

            {!isLoading && !isError && (data?.notifications.length ?? 0) === 0 ? (
              <div className="px-4 py-6">
                <p className="text-sm font-medium text-slate-800">You&apos;re all caught up</p>
                <p className="mt-1 text-sm text-slate-500">
                  You don&apos;t have any notifications right now.
                </p>
              </div>
            ) : null}

            <ul>
              {data?.notifications.map((notification) => (
                <li key={notification.id} className="border-b border-slate-100 last:border-b-0">
                  <div
                    className={`flex items-start gap-2 ${
                      notification.read ? "bg-white" : "bg-brand/5"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openNotification(
                          notification.id,
                          notification.read,
                          notification.relatedTripId,
                          notification.relatedTravelItemId,
                        )
                      }
                      className="min-w-0 flex-1 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {notification.message}
                      </p>
                      {notification.tripLabel ? (
                        <p className="mt-1 text-xs text-slate-500">{notification.tripLabel}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-400">
                        {formatRelativeTime(notification.createdAt)}
                        <span className="sr-only">
                          {notification.read ? ", read" : ", unread"}
                        </span>
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete notification: ${notification.message}`}
                      onClick={() => setPendingDeleteId(notification.id)}
                      className="mr-2 mt-3 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete this notification?"
        description="This removes the notification from your list. It does not change the trip or travel item."
        confirmLabel="Delete"
        destructive
        busy={removeNotification.isPending}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          await removeNotification.mutateAsync(pendingDeleteId);
          setPendingDeleteId(null);
          pushToast("Notification deleted.");
        }}
      />
    </div>
  );
}
