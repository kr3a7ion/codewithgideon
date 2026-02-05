
export interface RegistrationEntry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  path: string;
  ageRange: string;
  gender: string;
  weeksToCommit: number;
  totalPrice: number;
  status: 'Pending' | 'Complete';
  timestamp: number;
}

const STORAGE_KEY = 'cg_registrations';

export const registrationStore = {
  save(entry: Omit<RegistrationEntry, 'id' | 'timestamp' | 'status'>): RegistrationEntry {
    const registrations = this.getAll();
    const newEntry: RegistrationEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Pending',
      timestamp: Date.now()
    };
    registrations.push(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
    return newEntry;
  },

  updateStatus(id: string, status: 'Pending' | 'Complete'): void {
    const registrations = this.getAll();
    const index = registrations.findIndex(r => r.id === id);
    if (index !== -1) {
      registrations[index].status = status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
    }
  },

  getAll(): RegistrationEntry[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  delete(id: string): void {
    const registrations = this.getAll().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  },

  clearAll(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
};
