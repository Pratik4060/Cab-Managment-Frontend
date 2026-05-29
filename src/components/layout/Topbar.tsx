import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { MouseEvent, KeyboardEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { toggleTheme } from "../../redux/slices/themeSlice";

type BookingNotification = { _id: string; passengerName?: string; cabRequestNumber?: string; bookingId?: string };

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { mode } = useAppSelector((state) => state.theme);
  const user = useAppSelector((state) => state.auth.user);
  const newBookings = useAppSelector((state) => state.bookings.allItems.filter((booking) => booking.status === "New").slice(0, 5));
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>(() => JSON.parse(localStorage.getItem("seenBookingNotifications") || "[]"));
  const [clearedIds, setClearedIds] = useState<string[]>(() => JSON.parse(localStorage.getItem("clearedBookingNotifications") || "[]"));
  const unreadNotifications = notifications.filter((item) => !seenIds.includes(item._id));

  useEffect(() => {
    setNotifications(newBookings.filter((item: BookingNotification) => !clearedIds.includes(item._id)));
  }, [newBookings, clearedIds]);

  function openInquiry(notification: BookingNotification) {
    const nextSeen = Array.from(new Set([...seenIds, notification._id]));
    setSeenIds(nextSeen);
    localStorage.setItem("seenBookingNotifications", JSON.stringify(nextSeen));
    setOpenNotifications(false);
    navigate("/bookings/inquiries");
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
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2 border-b border-brand-100 bg-white/95 px-3 py-2 backdrop-blur dark:border-brand-950 dark:bg-zinc-950/95 sm:flex-nowrap sm:gap-3 sm:px-4 lg:px-6">
      <button className="btn-secondary p-2 md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-4 w-4" />
      </button>

      {/* <div className="hidden min-w-0 md:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Operations Console</p>
        <h1 className="truncate text-lg font-semibold text-slate-950 dark:text-white">Unique Carz</h1>
      </div> */}

      <div className="relative order-3 w-full sm:order-none sm:ml-2 sm:max-w-2xl sm:flex-1 lg:ml-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input h-10 rounded-lg bg-brand-50/70 pl-9 dark:bg-zinc-900" placeholder="Search bookings, invoices, drivers..." />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="relative">
          <button className="btn-secondary relative p-2" aria-label="Notifications" onClick={() => setOpenNotifications((value) => !value)}>
            <Bell className="h-4 w-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {unreadNotifications.length}
              </span>
            )}
          </button>
          {openNotifications && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-brand-100 bg-white p-2 shadow-2xl dark:border-brand-950 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-3 py-2 dark:border-brand-950">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                  <p className="text-xs text-slate-500">{unreadNotifications.length} new booking inquiries</p>
                </div>
                {notifications.length > 0 && (
                  <button className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 outline-none hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-950/40" onClick={clearAllNotifications}>
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto py-2">
                {notifications.length === 0 ? (
                  <p className="px-3 py-5 text-center text-sm text-slate-500">No new booking notifications.</p>
                ) : notifications.map((notification) => (
                  <button
                    key={notification._id}
                    className="w-full rounded-md px-3 py-2 text-left outline-none transition hover:bg-brand-50 dark:hover:bg-brand-950/30"
                    onClick={() => openInquiry(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{notification.passengerName || "New booking inquiry"}</p>
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
        <button className="btn-secondary p-2" onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme">
          {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="ml-1 flex shrink-0 items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/80 px-2 py-1 shadow-sm dark:border-brand-950 dark:bg-zinc-900 sm:min-w-[210px] sm:px-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-600/30">
          {(user?.name || "A").slice(0, 1)}
        </div>
        <div className="hidden min-w-0 text-sm sm:block">
          <p className="truncate font-semibold text-slate-900 dark:text-white">{user?.name || "Admin"}</p>
          <p className="truncate text-xs text-slate-500">{user?.role || "Administrator"}</p>
        </div>
      </div>
    </header>
  );
}

