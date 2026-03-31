export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: null,
    operationType,
    path
  }
  console.error('API Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const api = {
  async getCollection(collection: string) {
    try {
      const res = await fetch(`/api/${collection}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch ${collection}: ${res.status} ${text.substring(0, 100)}`);
      }
      return await res.json();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collection);
    }
  },

  async saveItem(collection: string, item: any) {
    try {
      const res = await fetch(`/api/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to save to ${collection}: ${res.status} ${text.substring(0, 100)}`);
      }
      return await res.json();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collection);
    }
  },

  async deleteItem(collection: string, id: string) {
    try {
      const res = await fetch(`/api/${collection}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to delete from ${collection}: ${res.status} ${text.substring(0, 100)}`);
      }
      return await res.json();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collection}/${id}`);
    }
  },

  async adminLogin(password: string) {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Server error" }));
        throw new Error(data.message || "비밀번호가 틀렸습니다.");
      }
      return await res.json();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'admin/login');
    }
  }
};
