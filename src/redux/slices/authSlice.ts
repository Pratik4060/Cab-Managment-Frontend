import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ApiError } from "../../api/client";
import { authApi, type LoginCredentials, type ProfileUpdatePayload } from "../../api/authApi";

type AuthUser = {
  id?: number | string;
  name: string;
  fullName?: string;
  email: string;
  role: string;
  phone?: string;
  isActive?: boolean | number;
  createdAt?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  profileLoading: boolean;
  profileError: string | null;
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

export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getProfile();
      if (!response.success || !response.user) {
        return rejectWithValue(response.message || "Unable to load profile.");
      }
      return normalizeUser(response.user);
    } catch (error) {
      return rejectWithValue(error instanceof ApiError ? error.message : "Unable to load profile.");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload: ProfileUpdatePayload, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(payload);
      if (!response.success || !response.user) {
        return rejectWithValue(response.message || "Unable to update profile.");
      }
      return {
        message: response.message || "Profile updated successfully.",
        user: normalizeUser(response.user)
      };
    } catch (error) {
      return rejectWithValue(error instanceof ApiError ? error.message : "Unable to update profile.");
    }
  }
);

const initialState: AuthState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
  loading: false,
  error: null,
  profileLoading: false,
  profileError: null,
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
    applyProfile(state, action: PayloadAction<Partial<AuthUser>>) {
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
      state.profileLoading = false;
      state.profileError = null;
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
      })
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profileError = null;
        state.user = action.payload;
        state.isAuthenticated = Boolean(state.token);
        localStorage.setItem("cab_admin_user", JSON.stringify(action.payload));
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = typeof action.payload === "string" ? action.payload : "Unable to load profile.";
      })
      .addCase(updateProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profileError = null;
        state.user = action.payload.user;
        localStorage.setItem("cab_admin_user", JSON.stringify(action.payload.user));
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = typeof action.payload === "string" ? action.payload : "Unable to update profile.";
      });
  }
});

function normalizeUser(user: { id: number | string; fullName?: string; name?: string; email: string; role: string; isActive?: boolean | number; createdAt?: string }): AuthUser {
  const name = user.fullName || user.name || user.email;
  return {
    id: user.id,
    name,
    fullName: user.fullName || name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}

export const { loadMe, logout, applyProfile, setAuthError } = authSlice.actions;
export default authSlice.reducer;
