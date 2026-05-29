import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { readStorage, storageKeys, writeStorage } from "../localStorage";

type ThemeMode = "light" | "dark";

const saved = readStorage<{ theme: ThemeMode }>(storageKeys.theme, { theme: "light" });
document.documentElement.classList.toggle("dark", saved.theme === "dark");

const persistTheme = (theme: ThemeMode) => {
  writeStorage(storageKeys.theme, { theme });
  document.documentElement.classList.toggle("dark", theme === "dark");
};

const themeSlice = createSlice({
  name: "theme",
  initialState: { mode: saved.theme },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
      persistTheme(state.mode);
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
      persistTheme(state.mode);
    }
  }
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
