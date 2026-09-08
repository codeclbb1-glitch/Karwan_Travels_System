import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  AirlineTicketBatch,
  Booking,
  HajjFormBatch,
  HajjPackage,
  HotelAllocation,
  Investment,
  LedgerEntry,
  OfficeExpense,
  Role,
  Toast,
  UmrahPackage,
} from "./types";
import { authApi, dataApi } from "./lib/api";
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
  setHajjFormBatches: (b: HajjFormBatch[]) => void;
  hajjPackages: HajjPackage[];
  setHajjPackages: (p: HajjPackage[]) => void;
  umrahPackages: UmrahPackage[];
  setUmrahPackages: (p: UmrahPackage[]) => void;
  bookings: Booking[];
  setBookings: (b: Booking[]) => void;
  ledger: LedgerEntry[];
  setLedger: (l: LedgerEntry[]) => void;
  investments: Investment[];
  setInvestments: (i: Investment[]) => void;
  officeExpenses: OfficeExpense[];
  setOfficeExpenses: (e: OfficeExpense[]) => void;
  airlineTickets: AirlineTicketBatch[];
  setAirlineTickets: (a: AirlineTicketBatch[]) => void;
  hotelAllocations: HotelAllocation[];
  setHotelAllocations: (h: HotelAllocation[]) => void;
  createBooking: (booking: Booking) => Promise<void>;
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
  const [ledger, setLedgerState] = useState<LedgerEntry[]>([]);
  const [investments, setInvestmentsState] = useState<Investment[]>([]);
  const [officeExpenses, setOfficeExpensesState] = useState<OfficeExpense[]>([]);
  const [airlineTickets, setAirlineTicketsState] = useState<AirlineTicketBatch[]>([]);
  const [hotelAllocations, setHotelAllocationsState] = useState<HotelAllocation[]>([]);

  const loadData = useCallback(async (currentRole: Role) => {
    const loaded = await dataApi.load(currentRole);
    setHajjFormBatchesState(loaded.hajjFormBatches);
    setHajjPackagesState(loaded.hajjPackages);
    setUmrahPackagesState(loaded.umrahPackages);
    setBookingsState(loaded.bookings);
    setLedgerState(loaded.ledger);
    setInvestmentsState(loaded.investments);
    setOfficeExpensesState(loaded.officeExpenses);
    setAirlineTicketsState(loaded.airlineTickets);
    setHotelAllocationsState(loaded.hotelAllocations);
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
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      if (!supabase.auth) return;
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
    setLedgerState([]);
    setInvestmentsState([]);
    setOfficeExpensesState([]);
    setAirlineTicketsState([]);
    setHotelAllocationsState([]);
  }, []);

  const setHajjFormBatches = useCallback((items: HajjFormBatch[]) => { setHajjFormBatchesState(items); void dataApi.saveForms(items); }, []);
  const setHajjPackages = useCallback((items: HajjPackage[]) => { setHajjPackagesState(items); void dataApi.saveHajjPackages(items); }, []);
  const setUmrahPackages = useCallback((items: UmrahPackage[]) => { setUmrahPackagesState(items); void dataApi.saveUmrahPackages(items); }, []);
  const setBookings = useCallback((items: Booking[]) => { setBookingsState(items); }, []);
  const setLedger = useCallback((items: LedgerEntry[]) => { setLedgerState(items); }, []);
  const setInvestments = useCallback((items: Investment[]) => { setInvestmentsState(items); void dataApi.saveInvestments(items); }, []);
  const setOfficeExpenses = useCallback((items: OfficeExpense[]) => { setOfficeExpensesState(items); void dataApi.saveExpenses(items); }, []);
  const setAirlineTickets = useCallback((items: AirlineTicketBatch[]) => { setAirlineTicketsState(items); void dataApi.saveAirline(items); }, []);
  const setHotelAllocations = useCallback((items: HotelAllocation[]) => { setHotelAllocationsState(items); void dataApi.saveHotels(items); }, []);
  const createBooking = useCallback(async (booking: Booking) => {
    await dataApi.createBooking(booking);
    if (role) await loadData(role);
  }, [loadData, role]);

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
        setHajjPackages,
        umrahPackages,
        setUmrahPackages,
        bookings,
        setBookings,
        ledger,
        setLedger,
        investments,
        setInvestments,
        officeExpenses,
        setOfficeExpenses,
        airlineTickets,
        setAirlineTickets,
        hotelAllocations,
        setHotelAllocations,
        createBooking,
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
