import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  Booking,
  HajjFormBatch,
  HajjPackage,
  HotelAllocation,
  Investment,
  OfficeExpense,
  Role,
  Task,
  Toast,
  UmrahPackage,
} from "./types";
import { authApi, dataApi, tasksApi } from "./lib/api";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

interface AppContextValue {
  role: Role | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;

  hajjFormBatches: HajjFormBatch[];
  setHajjFormBatches: (b: HajjFormBatch[]) => Promise<void>;
  hajjPackages: HajjPackage[];
  saveHajjPackage: (p: HajjPackage) => Promise<void>;
  deleteHajjPackage: (id: string) => Promise<void>;
  umrahPackages: UmrahPackage[];
  saveUmrahPackage: (p: UmrahPackage) => Promise<void>;
  deleteUmrahPackage: (id: string) => Promise<void>;
  bookings: Booking[];
  setBookings: (b: Booking[]) => void;
  investments: Investment[];
  setInvestments: (i: Investment[]) => Promise<void>;
  officeExpenses: OfficeExpense[];
  addOfficeExpense: (e: Omit<OfficeExpense, "id">) => Promise<void>;
  updateOfficeExpense: (id: string, e: Omit<OfficeExpense, "id">) => Promise<void>;
  deleteOfficeExpense: (id: string) => Promise<void>;
  hotelAllocations: HotelAllocation[];
  setHotelAllocations: (h: HotelAllocation[]) => Promise<void>;
  deleteHotel: (id: string) => Promise<void>;
  createBooking: (booking: Booking) => Promise<void>;
  tasks: Task[];
  loadTasks: () => Promise<void>;
  createTask: (task: Omit<Task, "id" | "createdAt" | "completedAt">) => Promise<void>;
  updateTaskStatus: (id: string, status: Task["status"]) => Promise<void>;
  updateTask: (id: string, fields: Partial<Pick<Task, "title" | "description" | "assignedToName" | "priority" | "dueDate">>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [hajjFormBatches, setHajjFormBatchesState] = useState<HajjFormBatch[]>([]);
  const [hajjPackages, setHajjPackagesState] = useState<HajjPackage[]>([]);
  const [umrahPackages, setUmrahPackagesState] = useState<UmrahPackage[]>([]);
  const [bookings, setBookingsState] = useState<Booking[]>([]);
  const [investments, setInvestmentsState] = useState<Investment[]>([]);
  const [officeExpenses, setOfficeExpensesState] = useState<OfficeExpense[]>([]);
  const [hotelAllocations, setHotelAllocationsState] = useState<HotelAllocation[]>([]);
  const [tasks, setTasksState] = useState<Task[]>([]);

  const loadData = useCallback(async (currentRole: Role) => {
    const loaded = await dataApi.load(currentRole);
    setHajjFormBatchesState(loaded.hajjFormBatches);
    setHajjPackagesState(loaded.hajjPackages);
    setUmrahPackagesState(loaded.umrahPackages);
    setBookingsState(loaded.bookings);
    setInvestmentsState(loaded.investments);
    setOfficeExpensesState(loaded.officeExpenses);
    setHotelAllocationsState(loaded.hotelAllocations);
    await tasksApi.load().then(setTasksState).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }
    let mounted = true;
    void authApi.session().then(async ({ data }) => {
      if (!mounted || !data.session) return;
      const profile = await authApi.profile();
      if (!mounted) return;
      setRole(profile.role);
      await loadData(profile.role);
    }).catch(() => {
      if (mounted) setRole(null);
    }).finally(() => {
      if (mounted) setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (!session) {
        setRole(null);
        setHajjFormBatchesState([]);
        setHajjPackagesState([]);
        setUmrahPackagesState([]);
        setBookingsState([]);
        setInvestmentsState([]);
        setOfficeExpensesState([]);
        setHotelAllocationsState([]);
        setTasksState([]);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        try {
          const profile = await authApi.profile();
          if (!mounted) return;
          setRole(profile.role);
          await loadData(profile.role);
        } catch {
          if (mounted) setRole(null);
        }
      }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [loadData]);

  const login = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.");
    const { error } = await authApi.signIn(email, password);
    if (error) throw error;
    const profile = await authApi.profile();
    setRole(profile.role);
    await loadData(profile.role);
  }, [loadData]);

  const logout = useCallback(async () => {
    await authApi.signOut();
    setRole(null);
    setHajjFormBatchesState([]);
    setHajjPackagesState([]);
    setUmrahPackagesState([]);
    setBookingsState([]);
    setInvestmentsState([]);
    setOfficeExpensesState([]);
    setHotelAllocationsState([]);
    setTasksState([]);
  }, []);

  const setHajjFormBatches = useCallback(async (items: HajjFormBatch[]) => {
    const prev = await new Promise<HajjFormBatch[]>((res) => { setHajjFormBatchesState((s) => { res(s); return items; }); });
    try { await dataApi.saveForms(items); }
    catch (e) { setHajjFormBatchesState(prev); throw e; }
  }, []);
  const saveHajjPackage = useCallback(async (item: HajjPackage) => {
    const isNew = item.id.length !== 36;
    const prev = hajjPackages;
    setHajjPackagesState((s) => isNew ? [...s, item] : s.map((p) => p.id === item.id ? item : p));
    try {
      const saved = await dataApi.saveHajjPackage(item);
      setHajjPackagesState((s) => isNew ? [...s.filter((p) => p.id === item.id ? false : true), saved] : s.map((p) => p.id === saved.id ? saved : p));
    } catch (e) { setHajjPackagesState(prev); throw e; }
  }, [hajjPackages]);
  const deleteHajjPackage = useCallback(async (id: string) => {
    const prev = hajjPackages;
    setHajjPackagesState((s) => s.filter((p) => p.id !== id));
    try { await dataApi.deleteHajjPackage(id); }
    catch (e) { setHajjPackagesState(prev); throw e; }
  }, [hajjPackages]);
  const saveUmrahPackage = useCallback(async (item: UmrahPackage) => {
    const isNew = item.id.length !== 36;
    const prev = umrahPackages;
    setUmrahPackagesState((s) => isNew ? [...s, item] : s.map((p) => p.id === item.id ? item : p));
    try {
      const saved = await dataApi.saveUmrahPackage(item);
      setUmrahPackagesState((s) => isNew ? [...s.filter((p) => p.id === item.id ? false : true), saved] : s.map((p) => p.id === saved.id ? saved : p));
    } catch (e) { setUmrahPackagesState(prev); throw e; }
  }, [umrahPackages]);
  const deleteUmrahPackage = useCallback(async (id: string) => {
    const prev = umrahPackages;
    setUmrahPackagesState((s) => s.filter((p) => p.id !== id));
    try { await dataApi.deleteUmrahPackage(id); }
    catch (e) { setUmrahPackagesState(prev); throw e; }
  }, [umrahPackages]);
  const setBookings = useCallback((items: Booking[]) => { setBookingsState(items); }, []);
  const setInvestments = useCallback(async (items: Investment[]) => {
    const prev = await new Promise<Investment[]>((res) => { setInvestmentsState((s) => { res(s); return items; }); });
    try { await dataApi.saveInvestments(items); }
    catch (e) { setInvestmentsState(prev); throw e; }
  }, []);
  const addOfficeExpense = useCallback(async (item: Omit<OfficeExpense, "id">) => {
    const saved = await dataApi.addExpense(item);
    setOfficeExpensesState((prev) => [saved, ...prev]);
  }, []);
  const updateOfficeExpense = useCallback(async (id: string, item: Omit<OfficeExpense, "id">) => {
    const saved = await dataApi.updateExpense(id, item);
    setOfficeExpensesState((prev) => prev.map((e) => e.id === id ? saved : e));
  }, []);
  const deleteOfficeExpense = useCallback(async (id: string) => {
    setOfficeExpensesState((prev) => prev.filter((e) => e.id !== id));
    try { await dataApi.deleteExpense(id); }
    catch (e) { if (role) await loadData(role); throw e; }
  }, [role, loadData]);
  const setHotelAllocations = useCallback(async (items: HotelAllocation[]) => {
    const prev = await new Promise<HotelAllocation[]>((res) => { setHotelAllocationsState((s) => { res(s); return items; }); });
    try { const saved = await dataApi.saveHotels(items); setHotelAllocationsState(saved); }
    catch (e) { setHotelAllocationsState(prev); throw e; }
  }, []);
  const deleteHotel = useCallback(async (id: string) => {
    const prev = hotelAllocations;
    setHotelAllocationsState((s) => s.filter((h) => h.id !== id));
    try { await dataApi.deleteHotel(id); }
    catch (e) { setHotelAllocationsState(prev); throw e; }
  }, [hotelAllocations]);
  const createBooking = useCallback(async (booking: Booking) => {
    await dataApi.createBooking(booking);
    if (role) await loadData(role);
  }, [loadData, role]);

  const loadTasks = useCallback(async () => {
    await tasksApi.load().then(setTasksState).catch(() => {});
  }, []);

  const createTask = useCallback(async (task: Omit<Task, "id" | "createdAt" | "completedAt">) => {
    await tasksApi.create(task);
    await loadTasks();
  }, [loadTasks]);

  const updateTask = useCallback(async (id: string, fields: Partial<Pick<Task, "title" | "description" | "assignedToName" | "priority" | "dueDate">>) => {
    const saved = await tasksApi.update(id, fields);
    setTasksState((prev) => prev.map((t) => t.id === id ? saved : t));
  }, []);

  const updateTaskStatus = useCallback(async (id: string, status: Task["status"]) => {
    await tasksApi.updateStatus(id, status);
    await loadTasks();
  }, [loadTasks]);

  const deleteTask = useCallback(async (id: string) => {
    await tasksApi.delete(id);
    setTasksState((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        authLoading,
        login,
        logout,
        toasts,
        showToast,
        removeToast,
        hajjFormBatches,
        setHajjFormBatches,
        hajjPackages,
        saveHajjPackage,
        deleteHajjPackage,
        umrahPackages,
        saveUmrahPackage,
        deleteUmrahPackage,
        bookings,
        setBookings,
        investments,
        setInvestments,
        officeExpenses,
        addOfficeExpense,
        updateOfficeExpense,
        deleteOfficeExpense,
        hotelAllocations,
        setHotelAllocations,
        deleteHotel,
        createBooking,
        tasks,
        loadTasks,
        createTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
