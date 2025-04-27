"use client";

import { usePathname } from "next/navigation";
import { HomeIcon, MessageSquareText, ReceiptText } from "lucide-react"; // install lucide-react or use any icon library
import Link from "next/link";

const tabs = [
	{ href: "/", label: "Home", icon: HomeIcon },
	{ href: "/chat", label: "Chat", icon: MessageSquareText },
	{ href: "/transactions", label: "My Bills", icon: ReceiptText },
	// { href: "/profile", label: "Profile", icon: UserIcon },
];

export default function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 w-full bg-white shadow-t border-t border-gray-100 flex flex-row justify-between p-3 md:hidden">
			{tabs.map((tab) => {
				const Icon = tab.icon;
				const isActive = pathname === tab.href;
				const isChat = tab.href === "/chat";

				return (
					<Link
						href={tab.href}
						key={tab.href}
						className={`flex flex-col items-center justify-center text-xs w-1/3 ${
							isActive
								? isChat
									? "text-blue-500 font-bold"
									: "text-black font-medium"
								: "text-gray-400"
						} hover:text-black`}
					>
						<Icon
							className={`h-6 w-6 ${
								isChat &&
								"rounded-full text-white h-12 w-12 p-3"
							} ${
								isChat &&
								(isActive ? "bg-blue-500" : "bg-gray-400")
							}`}
						/>
						<span>{tab.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
