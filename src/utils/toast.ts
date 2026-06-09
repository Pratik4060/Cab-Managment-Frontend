export type ToastType = "success" | "error" | "info";

export type ToastPayload = {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
};

export function showToast(payload: ToastPayload) {
  if (!payload.message) return;
  window.dispatchEvent(new CustomEvent<ToastPayload>("cab-toast", {
    detail: {
      type: "info",
      duration: 3500,
      ...payload
    }
  }));
}
