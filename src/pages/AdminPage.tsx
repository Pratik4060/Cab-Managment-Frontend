import { Moon, Save, Sun } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { toggleTheme } from "../redux/slices/themeSlice";
import { updateProfile } from "../redux/slices/authSlice";
import { adminActions } from "../redux/slices/adminSlice";
import { EntityPage } from "./EntityPage";

export function AdminsPage() {
  return <EntityPage title="Manage Admins" subtitle="Create users, assign roles, and manage access." stateKey="admins" actions={adminActions} columns={[
    { key: "name", header: "Name" }, { key: "email", header: "Email" }, { key: "role", header: "Role" }, { key: "isActive", header: "Active", render: (r: any) => r.isActive ? "Yes" : "No" }
  ]} fields={[
    { name: "name", label: "Name" }, { name: "email", label: "Email" }, { name: "password", label: "Password", type: "password" }, { name: "role", label: "Role", type: "select", options: ["Super Admin", "Operations Admin", "Billing Admin", "Viewer"] }
  ]} />;
}

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const mode = useAppSelector((state) => state.theme.mode);
  const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "", avatarUrl: user?.avatarUrl || "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    dispatch(updateProfile(profile));
    setMessage("Profile updated.");
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    setPasswords({ currentPassword: "", newPassword: "" });
    setMessage("Password changed for this local demo session.");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-slate-500">Manage your admin profile, password, avatar URL, and theme preference.</p>
      </div>
      {message && <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</div>}
      <div className="grid gap-5 xl:grid-cols-2">
        <form className="panel p-5" onSubmit={saveProfile}>
          <h2 className="mb-4 font-semibold">Profile Details</h2>
          <div className="space-y-4">
            <label><span className="mb-1 block text-sm font-medium">Name</span><input className="input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></label>
            <label><span className="mb-1 block text-sm font-medium">Phone</span><input className="input" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></label>
            <label><span className="mb-1 block text-sm font-medium">Avatar URL</span><input className="input" value={profile.avatarUrl} onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))} /></label>
            <button className="btn-primary"><Save className="h-4 w-4" />Save Profile</button>
          </div>
        </form>
        <div className="space-y-5">
          <form className="panel p-5" onSubmit={savePassword}>
            <h2 className="mb-4 font-semibold">Change Password</h2>
            <div className="space-y-4">
              <input className="input" type="password" placeholder="Current password" value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} />
              <input className="input" type="password" placeholder="New password" value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} />
              <button className="btn-secondary"><Save className="h-4 w-4" />Change Password</button>
            </div>
          </form>
          <section className="panel p-5">
            <h2 className="mb-4 font-semibold">Theme</h2>
            <button className="btn-secondary" onClick={() => dispatch(toggleTheme())}>{mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{mode === "dark" ? "Light Mode" : "Dark Mode"}</button>
          </section>
        </div>
      </div>
    </div>
  );
}

