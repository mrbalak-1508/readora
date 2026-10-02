import Swal from "sweetalert2";

// READORA Warm Library Palette Configuration
const PLUM = "#5B3FA3";
const CREAM = "#FFF9F0";
const CHARCOAL = "#202124";
const BORDER = "#E9E1D7";

export const ReadoraAlert = Swal.mixin({
  background: "#FFFFFF",
  color: CHARCOAL,
  confirmButtonColor: PLUM,
  customClass: {
    popup: "readora-swal-popup",
    title: "readora-swal-title",
    confirmButton: "readora-swal-confirm",
    cancelButton: "readora-swal-cancel",
  },
});

export function showErrorAlert(title: string, text: string) {
  return ReadoraAlert.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "Understood",
    confirmButtonColor: PLUM,
    background: "#FFFFFF",
    backdrop: `rgba(32, 33, 36, 0.45)`,
    buttonsStyling: true,
  });
}

export function showSuccessAlert(title: string, text: string) {
  return ReadoraAlert.fire({
    icon: "success",
    title,
    text,
    timer: 2000,
    showConfirmButton: false,
    timerProgressBar: true,
    background: "#FFFFFF",
    backdrop: `rgba(32, 33, 36, 0.45)`,
  });
}

export function showToastAlert(
  titleOrOptions: string | { title: string; text?: string; icon?: "success" | "error" | "info" | "warning" | string },
  icon: "success" | "error" | "info" | "warning" = "success"
) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "#FFFFFF",
    color: CHARCOAL,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  if (typeof titleOrOptions === "object") {
    return Toast.fire({
      icon: (titleOrOptions.icon as any) || "success",
      title: titleOrOptions.title,
      text: titleOrOptions.text,
    });
  }

  return Toast.fire({
    icon,
    title: titleOrOptions,
  });
}

export async function showConfirmAlert(
  title: string,
  text: string,
  confirmButtonText = "Yes, proceed",
  cancelButtonText = "Cancel",
  isDestructive = true
): Promise<boolean> {
  const result = await ReadoraAlert.fire({
    title,
    text,
    icon: isDestructive ? "warning" : "question",
    showCancelButton: true,
    confirmButtonColor: isDestructive ? "#DC2626" : PLUM,
    cancelButtonColor: "#6B7280",
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    backdrop: `rgba(32, 33, 36, 0.45)`,
  });
  return result.isConfirmed;
}
