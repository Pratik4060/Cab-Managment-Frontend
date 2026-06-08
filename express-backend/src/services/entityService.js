import { createId } from "../utils/id.js";
import { readStore, writeStore } from "../data/store.js";

export function createEntityService(resource, allowedFields, defaults = {}) {
  const singular = resource.endsWith("s") ? resource.slice(0, -1) : resource;

  function pick(body) {
    return allowedFields.reduce((acc, key) => {
      if (body[key] !== undefined) acc[key] = body[key];
      return acc;
    }, {});
  }

  return {
    async list(query = {}) {
      const store = await readStore();
      let items = [...store[resource]];

      const status = query.status;
      const search = String(query.search || "").trim().toLowerCase();
      if (status) items = items.filter((item) => String(item.status) === String(status));
      if (search) {
        items = items.filter((item) =>
          Object.values(item).some((value) => String(value ?? "").toLowerCase().includes(search))
        );
      }

      const sort = query.sort;
      if (sort) {
        const desc = String(sort).startsWith("-");
        const key = desc ? String(sort).slice(1) : String(sort);
        items.sort((a, b) => {
          const left = String(a?.[key] ?? "");
          const right = String(b?.[key] ?? "");
          if (left === right) return 0;
          const result = left > right ? 1 : -1;
          return desc ? -result : result;
        });
      }

      const limit = Number(query.limit || 0);
      const page = Math.max(1, Number(query.page || 1));
      const total = items.length;
      const pages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
      const start = limit > 0 ? (page - 1) * limit : 0;
      const end = limit > 0 ? start + limit : total;
      const pagedItems = limit > 0 ? items.slice(start, end) : items;

      return { items: pagedItems, total, page, pages };
    },

    async getById(id) {
      const store = await readStore();
      return store[resource].find((item) => item._id === id) || null;
    },

    async create(body) {
      const store = await readStore();
      const now = new Date().toISOString();
      const item = {
        _id: createId(singular.slice(0, 3)),
        createdAt: now,
        updatedAt: now,
        ...defaults,
        ...pick(body)
      };
      store[resource].unshift(item);
      await writeStore(store);
      return item;
    },

    async update(id, body, patchOnly = false) {
      const store = await readStore();
      const index = store[resource].findIndex((item) => item._id === id);
      if (index === -1) return null;

      const updates = patchOnly ? pick(body, ["status"]) : pick(body);
      store[resource][index] = {
        ...store[resource][index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await writeStore(store);
      return store[resource][index];
    },

    async changeStatus(id, status) {
      return this.update(id, { status }, true);
    },

    async remove(id) {
      const store = await readStore();
      const index = store[resource].findIndex((item) => item._id === id);
      if (index === -1) return null;
      const [removed] = store[resource].splice(index, 1);
      await writeStore(store);
      return removed;
    }
  };
}
