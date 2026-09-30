import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LoaderCircle } from "lucide-react";
import { ApiClientError } from "../../api/client";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useNotifications";

export function NotificationMenu() {
  const navigate = useNavigate();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

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
        className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-teal-200 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Notifications</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-teal-700 px-1.5 text-[10px] font-semibold text-white">
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
              className="text-xs font-semibold text-teal-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading || (isFetching && !data) ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading notifications
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
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : null}

            {!isLoading && !isError && (data?.notifications.length ?? 0) === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">
                No notifications yet. Expiry reminders will show up here.
              </p>
            ) : null}

            <ul>
              {data?.notifications.map((notification) => (
                <li key={notification.id}>
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
                    className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                      notification.read ? "bg-white" : "bg-teal-50/60"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {notification.read ? "Read" : "Unread"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
