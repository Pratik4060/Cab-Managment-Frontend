import { Bell, Menu, Moon, Sun } from "lucide-react";
import { MouseEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { toggleTheme } from "../../redux/slices/themeSlice";

type BookingNotification = { _id: string; passengerName?: string; cabRequestNumber?: string; bookingId?: string };

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { mode } = useAppSelector((state) => state.theme);
  const bookings = useAppSelector((state) => state.bookings.allItems);
  const newBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "New").slice(0, 5),
    [bookings]
  );
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>(() => JSON.parse(localStorage.getItem("seenBookingNotifications") || "[]"));
  const [clearedIds, setClearedIds] = useState<string[]>(() => JSON.parse(localStorage.getItem("clearedBookingNotifications") || "[]"));
  const unreadNotifications = notifications.filter((item) => !seenIds.includes(item._id));

  useEffect(() => {
    setNotifications(newBookings.filter((item: BookingNotification) => !clearedIds.includes(item._id)));
  }, [newBookings, clearedIds]);

  function openTrips(notification: BookingNotification) {
    const nextSeen = Array.from(new Set([...seenIds, notification._id]));
    setSeenIds(nextSeen);
    localStorage.setItem("seenBookingNotifications", JSON.stringify(nextSeen));
    setOpenNotifications(false);
    navigate("/bookings/trips");
  }

  function clearNotification(event: MouseEvent | KeyboardEvent, notificationId: string) {
    event.stopPropagation();
    const nextSeen = Array.from(new Set([...seenIds, notificationId]));
    const nextCleared = Array.from(new Set([...clearedIds, notificationId]));
    setSeenIds(nextSeen);
    setClearedIds(nextCleared);
    setNotifications((items) => items.filter((notification) => notification._id !== notificationId));
    localStorage.setItem("seenBookingNotifications", JSON.stringify(nextSeen));
    localStorage.setItem("clearedBookingNotifications", JSON.stringify(nextCleared));
  }

  function clearAllNotifications() {
    const nextSeen = notifications.map((notification) => notification._id);
    const nextCleared = Array.from(new Set([...clearedIds, ...nextSeen]));
    setSeenIds(nextSeen);
    setClearedIds(nextCleared);
    setNotifications([]);
    localStorage.setItem("seenBookingNotifications", JSON.stringify(nextSeen));
    localStorage.setItem("clearedBookingNotifications", JSON.stringify(nextCleared));
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-brand-100 bg-white/95 px-2.5 py-1.5 backdrop-blur dark:border-red-950/40 dark:bg-[#0d0d0f]/95 sm:gap-3 sm:px-3 lg:px-4">
      <button className="btn-secondary p-1.5 md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-3.5 w-3.5" />
      </button>

      <div className="flex-1" />

      <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
        <div className="relative">
          <button className="btn-secondary relative p-1.5" aria-label="Notifications" onClick={() => setOpenNotifications((value) => !value)}>
            <Bell className="h-3.5 w-3.5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {unreadNotifications.length}
              </span>
            )}
          </button>
          {openNotifications && (
            <div className="absolute right-0 top-11 z-5 w-72 rounded-lg border border-brand-100 bg-white p-2 shadow-2xl dark:border-red-950/40 dark:bg-[#101012]">
              <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-2.5 py-1.5 dark:border-red-950/40">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                  <p className="text-xs text-slate-500">{unreadNotifications.length} new trip requests</p>
                </div>
                {notifications.length > 0 && (
                  <button className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 outline-none hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-950/40" onClick={clearAllNotifications}>
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto py-1.5">
                {notifications.length === 0 ? (
                  <p className="px-3 py-5 text-center text-sm text-slate-500">No new trip notifications.</p>
                ) : notifications.map((notification) => (
                  <button
                    key={notification._id}
                    className="w-full rounded-md px-2.5 py-1.5 text-left outline-none transition hover:bg-slate-50 dark:hover:bg-red-950/20"
                    onClick={() => openTrips(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{notification.passengerName || "New trip request"}</p>
                        <p className="text-xs text-slate-500">{notification.cabRequestNumber || notification.bookingId}</p>
                        <span
                          role="button"
                          tabIndex={0}
                          className="mt-1 inline-block text-xs font-medium text-slate-500 hover:text-brand-700 dark:hover:text-brand-200"
                          onClick={(event) => clearNotification(event, notification._id)}
                          onKeyDown={(event) => { if (event.key === "Enter") clearNotification(event, notification._id); }}
                        >
                          Clear
                        </span>
                      </div>
                      {!seenIds.includes(notification._id) && <span className="mt-1 h-2 w-2 rounded-full bg-red-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="btn-secondary p-1.5" onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme">
          {mode === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  );
}

