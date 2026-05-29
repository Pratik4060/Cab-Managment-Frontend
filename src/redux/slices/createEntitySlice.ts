import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type EntityState = {
  items: any[];
  allItems: any[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;
  filter: Record<string, any>;
};

type EntityOptions = {
  seed: any[];
  createDefaults?: (payload: any, items: any[]) => Record<string, any>;
};

const createId = (name: string) => `${name.slice(0, 3)}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

function applyFilter(items: any[], filter: Record<string, any> = {}) {
  return items.filter((item) => Object.entries(filter).every(([key, value]) => {
    if (value === undefined || value === null || value === "") return true;
    return String(item[key]) === String(value);
  }));
}

function refresh(state: EntityState) {
  state.items = applyFilter(state.allItems, state.filter);
  state.total = state.items.length;
  state.page = 1;
  state.pages = 1;
  state.loading = false;
}

export function createEntitySlice(name: string, options: EntityOptions) {
  const initialState: EntityState = {
    items: options.seed,
    allItems: options.seed,
    total: options.seed.length,
    page: 1,
    pages: 1,
    loading: false,
    error: null,
    filter: {}
  };

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      fetchAll(state, action: PayloadAction<Record<string, any> | undefined>) {
        state.filter = action.payload || {};
        refresh(state);
      },
      setItems(state, action: PayloadAction<any[]>) {
        state.allItems = action.payload;
        refresh(state);
      },
      createOne: {
        reducer(state, action: PayloadAction<any>) {
          const defaults = options.createDefaults?.(action.payload, state.allItems) || {};
          state.allItems.unshift({ ...defaults, ...action.payload });
          refresh(state);
        },
        prepare(payload: any) {
          return {
            payload: {
              _id: payload._id || createId(name),
              createdAt: payload.createdAt || new Date().toISOString(),
              ...payload
            }
          };
        }
      },
      updateOne(state, action: PayloadAction<{ id: string; payload: any }>) {
        state.allItems = state.allItems.map((item) => (
          item._id === action.payload.id
            ? { ...item, ...action.payload.payload, updatedAt: new Date().toISOString() }
            : item
        ));
        refresh(state);
      },
      deleteOne(state, action: PayloadAction<string>) {
        state.allItems = state.allItems.filter((item) => item._id !== action.payload);
        refresh(state);
      },
      changeStatus(state, action: PayloadAction<{ id: string; status: string }>) {
        state.allItems = state.allItems.map((item) => item._id === action.payload.id ? { ...item, status: action.payload.status } : item);
        refresh(state);
      }
    }
  });

  return { reducer: slice.reducer, actions: slice.actions };
}

export { applyFilter };
