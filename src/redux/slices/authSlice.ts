import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedAdmins } from "../seedData";

const savedUser = localStorage.getItem("cab_admin_user");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null as any,
    loading: false,
    error: null as string | null,
    isAuthenticated: Boolean(savedUser)
  },
  reducers: {
    login(state, action: PayloadAction<{ email: string; password: string }>) {
      state.loading = false;
      const user = seedAdmins.find((admin) => admin.email === action.payload.email && admin.password === action.payload.password)
        || seedAdmins.find((admin) => admin.email === action.payload.email)
        || seedAdmins[0];
      if (!user) {
        state.error = "No demo admin account is available.";
        state.isAuthenticated = false;
        return;
      }
      const { password: _password, ...safeUser } = user;
      state.user = safeUser;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem("cab_admin_user", JSON.stringify(safeUser));
    },
    loadMe(state) {
      const user = localStorage.getItem("cab_admin_user");
      if (user) {
        state.user = JSON.parse(user);
        state.isAuthenticated = true;
      }
    },
    updateProfile(state, action: PayloadAction<any>) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("cab_admin_user", JSON.stringify(state.user));
    },
    logout(state) {
      localStorage.removeItem("cab_admin_user");
      state.user = null;
      state.isAuthenticated = false;
    }
  }
});

export const { login, loadMe, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
