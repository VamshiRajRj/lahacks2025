"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { PersonType } from "@/types/PersonType";
import { SplitType } from "@/types/SplitType";
import { TransactionType } from "@/types/TransactionsType";

// Types for context
interface AppContextType {
	user: PersonType | null;
	setUser: (user: PersonType | null) => void;
	addTransaction: (tx: TransactionType) => Promise<void>;
}

// Base URL for Flask backend
const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL; // adjust if needed

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// AppProvider component
export function AppProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<PersonType | null>(null);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const res = await fetch(`${BASE_URL}/user`);
				const data = await res.json();
				setUser(data);
			} catch (error) {
				console.error("Failed to fetch user:", error);
			}
		};
		fetchUser();
	}, []);

	const addTransaction = async (tx: TransactionType) => {
		try {
			await fetch(`${BASE_URL}/transactions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(tx),
			});
		} catch (error) {
			console.error("Failed to add transaction:", error);
		}
	};

	return (
		<AppContext.Provider
			value={{
				user,
				setUser,
				addTransaction,
			}}
		>
			{children}
		</AppContext.Provider>
	);
}

// Hook to access context
export function useApp() {
	const context = useContext(AppContext);
	if (context === undefined) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context;
}

// Hook to get user
export function useUser() {
	const { user, setUser } = useApp();
	return { user, setUser };
}

// Hook to fetch all splits
export function useSplits() {
	const [splits, setSplits] = useState<SplitType[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchSplits = async () => {
			setLoading(true);
			try {
				const res = await fetch(`${BASE_URL}/splits`);
				const data = await res.json();
				setSplits(data);
			} catch (error) {
				console.error("Failed to fetch splits:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchSplits();
	}, []);

	return { splits, loading };
}

// Hook to fetch single split
export function useSplit(splitId: string | number) {
	const [split, setSplit] = useState<SplitType | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchSplit = async () => {
			if (!splitId) return;
			setLoading(true);
			try {
				const res = await fetch(`${BASE_URL}/splits`);
				const data: SplitType[] = await res.json();
				const found = data.find((s) => s.id === Number(splitId));
				setSplit(found || null);
			} catch (error) {
				console.error("Failed to fetch split by id:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchSplit();
	}, [splitId]);

	return { split, loading };
}

// Hook to fetch transactions
export function useTransactions(splitId?: string) {
	const [transactions, setTransactions] = useState<TransactionType[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchTransactions = async () => {
			setLoading(true);
			try {
				const url = `${BASE_URL}/transactions`;
				const res = await fetch(url);
				const data: TransactionType[] = await res.json();
				if (splitId) {
					const filtered = data.filter(
						(tx) => tx.splitId === Number(splitId)
					);
					setTransactions(filtered);
				} else {
					setTransactions(data);
				}
			} catch (error) {
				console.error("Failed to fetch transactions:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchTransactions();
	}, [splitId]);

	return { transactions, loading };
}
