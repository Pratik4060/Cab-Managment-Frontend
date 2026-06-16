import { Eye, EyeOff, Loader2, Moon, Save, Sun } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { toggleTheme } from "../redux/slices/themeSlice";
import { fetchProfile, updateProfile } from "../redux/slices/authSlice";
import { adminActions } from "../redux/slices/adminSlice";
import { EntityPage } from "./EntityPage";

export function AdminsPage() {
  return <EntityPage title="Manage Admins" subtitle="Create users, assign roles, and manage access." stateKey="admins" actions={adminActions} columns={[
    { key: "name", header: "Name" }, { key: "email", header: "Email" }, { key: "role", header: "Role" }, { key: "isActive", header: "Status", render: (r: any) => r.isActive === true || r.isActive === "true" ? "Active" : "Disabled" }
  ]} fields={[
    { name: "name", label: "Name" }, { name: "email", label: "Email" }, { name: "password", label: "Password", type: "password" }, { name: "role", label: "Role", type: "select", options: ["Super Admin", "Operations Admin", "Billing Admin", "Viewer"] },
    { name: "isActive", label: "Status", type: "select", options: [{ value: "true", label: "Active" }, { value: "false", label: "Disabled" }], valueType: "boolean" }
  ]} defaults={{ isActive: "true" }} />;
}

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const profileLoading = useAppSelector((state) => state.auth.profileLoading);
  const profileError = useAppSelector((state) => state.auth.profileError);
  const mode = useAppSelector((state) => state.theme.mode);
  const [profile, setProfile] = useState({ fullName: user?.fullName || user?.name || "", email: user?.email || "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    setProfile({ fullName: user?.fullName || user?.name || "", email: user?.email || "" });
  }, [user?.email, user?.fullName, user?.name]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const payload = buildProfilePayload(profile, passwords);
    if (!payload) {
      setMessage("Please enter both current password and new password.");
      return;
    }
    const result = await dispatch(updateProfile(payload));
    if (updateProfile.fulfilled.match(result)) {
      setMessage(result.payload.message);
      setPasswords({ currentPassword: "", newPassword: "" });
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const payload = buildProfilePayload(profile, passwords, true);
    if (!payload) {
      setMessage("Please enter both current password and new password.");
      return;
    }
    const result = await dispatch(updateProfile(payload));
    if (!updateProfile.fulfilled.match(result)) return;
    setPasswords({ currentPassword: "", newPassword: "" });
    setMessage(result.payload.message);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-sm text-slate-500">Manage your admin profile, password, and theme preference.</p>
      </div>
      {message && <div className="rounded-md bg-emerald-50 p-2.5 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</div>}
      {profileError && <div className="rounded-md bg-red-50 p-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{profileError}</div>}
      <div className="grid gap-4 xl:grid-cols-2">
        <form className="panel relative p-4" onSubmit={saveProfile}>
          {profileLoading && <ProfileLoader />}
          <h2 className="mb-3 text-[15px] font-semibold">Profile Details</h2>
          <div className="space-y-3">
            <label><span className="mb-1 block text-sm font-medium">Full Name</span><input className="input" value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} /></label>
            <label><span className="mb-1 block text-sm font-medium">Email</span><input className="input" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></label>
            <button className="btn-primary" disabled={profileLoading}><Save className="h-4 w-4" />Save Profile</button>
          </div>
        </form>
        <div className="space-y-4">
          <form className="panel relative p-4" onSubmit={savePassword}>
            {profileLoading && <ProfileLoader />}
            <h2 className="mb-3 text-[15px] font-semibold">Change Password</h2>
            <div className="space-y-3">
              <PasswordInput
                placeholder="Current password"
                value={passwords.currentPassword}
                visible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((value) => !value)}
                onChange={(value) => setPasswords((p) => ({ ...p, currentPassword: value }))}
              />
              <PasswordInput
                placeholder="New password"
                value={passwords.newPassword}
                visible={showNewPassword}
                onToggle={() => setShowNewPassword((value) => !value)}
                onChange={(value) => setPasswords((p) => ({ ...p, newPassword: value }))}
              />
              <button className="btn-secondary" disabled={profileLoading}><Save className="h-4 w-4" />Change Password</button>
            </div>
          </form>
          <section className="panel p-4">
            <h2 className="mb-3 text-[15px] font-semibold">Theme</h2>
            <button className="btn-secondary" onClick={() => dispatch(toggleTheme())}>{mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{mode === "dark" ? "Light Mode" : "Dark Mode"}</button>
          </section>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  placeholder,
  value,
  visible,
  onToggle,
  onChange
}: {
  placeholder: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        className="input pr-10"
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-brand-200"
        aria-label={visible ? `Hide ${placeholder}` : `Show ${placeholder}`}
        onClick={onToggle}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function buildProfilePayload(
  profile: { fullName: string; email: string },
  passwords: { currentPassword: string; newPassword: string },
  requirePassword = false
) {
  const currentPassword = passwords.currentPassword.trim();
  const newPassword = passwords.newPassword.trim();
  const hasAnyPassword = Boolean(currentPassword || newPassword);

  if ((requirePassword || hasAnyPassword) && (!currentPassword || !newPassword)) {
    return null;
  }

  return {
    fullName: profile.fullName.trim(),
    email: profile.email.trim(),
    ...(hasAnyPassword ? { currentPassword, newPassword } : {})
  };
}

function ProfileLoader() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm dark:bg-black/45">
      <div className="rounded-2xl border border-brand-100 bg-white px-5 py-4 text-center shadow-2xl shadow-brand-600/15 dark:border-red-950/45 dark:bg-[#111114]">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 dark:text-brand-200" />
        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Syncing profile...</p>
      </div>
    </div>
  );
}

