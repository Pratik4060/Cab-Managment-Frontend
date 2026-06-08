import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ApiError } from "../../api/client";
import { authApi, type LoginCredentials } from "../../api/authApi";

type AuthUser = {
  id?: number | string;
  name: string;
  fullName?: string;
  email: string;
  role: string;
  phone?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
};

const savedUser = localStorage.getItem("cab_admin_user");
const savedToken = localStorage.getItem("cab_admin_token");

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      if (!response.success || !response.token || !response.user) {
        return rejectWithValue(response.message || "Invalid login response.");
      }
      return {
        token: response.token,
        user: normalizeUser(response.user)
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Unable to connect to the server. Please try again.");
    }
  }
);

const initialState: AuthState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
  loading: false,
  error: null,
  isAuthenticated: Boolean(savedToken && savedUser)
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loadMe(state) {
      const user = localStorage.getItem("cab_admin_user");
      const token = localStorage.getItem("cab_admin_token");
      if (user && token) {
        state.user = JSON.parse(user);
        state.token = token;
        state.isAuthenticated = true;
      }
    },
    updateProfile(state, action: PayloadAction<Partial<AuthUser>>) {
      state.user = state.user ? { ...state.user, ...action.payload } : null;
      if (state.user) {
        localStorage.setItem("cab_admin_user", JSON.stringify(state.user));
      }
    },
    logout(state) {
      localStorage.removeItem("cab_admin_token");
      localStorage.removeItem("cab_admin_user");
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem("cab_admin_token", action.payload.token);
        localStorage.setItem("cab_admin_user", JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Login failed. Please try again.";
        state.isAuthenticated = false;
      });
  }
});

function normalizeUser(user: { id: number | string; fullName?: string; name?: string; email: string; role: string }): AuthUser {
  const name = user.fullName || user.name || user.email;
  return {
    id: user.id,
    name,
    fullName: user.fullName || name,
    email: user.email,
    role: user.role
  };
}

export const { loadMe, logout, updateProfile, setAuthError } = authSlice.actions;
export default authSlice.reducer;
