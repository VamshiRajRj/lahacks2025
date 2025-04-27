"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

interface LayoutProps {
	children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	return (
		<div className="flex min-h-screen bg-gray-50">
			{/* Sidebar for desktop */}
			<Sidebar />

			{/* Main content area */}
			<main className="flex-1 flex flex-col max-h-[calc(100vh-90px)] md:max-h-screen overflow-y-auto">
				{/* Content area with proper spacing */}
				<div className="flex-1 pt-8 md:pt-0">{children}</div>

				{/* Bottom navigation for mobile */}
				<BottomNav />
			</main>
		</div>
	);
}
