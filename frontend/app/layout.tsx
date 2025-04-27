import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import { AppProvider } from "../context/AppContext";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "SmartSplit",
	description: "Split expenses with friends and roommates",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={plusJakartaSans.className}>
				<AppProvider>
					<Layout>{children}</Layout>
				</AppProvider>
			</body>
		</html>
	);
}
