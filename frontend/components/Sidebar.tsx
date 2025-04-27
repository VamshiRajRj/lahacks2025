"use client";
import { usePathname } from "next/navigation";
import { HomeIcon, ReceiptText, MessageSquareText } from "lucide-react";

const tabs = [
	{ href: "/", label: "Home", icon: HomeIcon },
	{ href: "/transactions", label: "My Bills", icon: ReceiptText },
];

export default function Sidebar() {
	const pathname = usePathname();

	return (
		<nav className="hidden md:flex md:flex-col w-64 h-screen bg-white border-r border-gray-200 shadow-md">
			{/* Logo */}
			<div className="p-6">
				<span className="text-xl font-bold text-gray-900">
					SmartSplit
				</span>
			</div>

			{/* Navigation */}
			<div className="flex-1 p-4 space-1">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = pathname === tab.href;

					return (
						<a
							key={tab.href}
							href={tab.href}
							className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
								isActive
									? "bg-blue-50 text-blue-600"
									: "text-gray-600 hover:bg-gray-50"
							}`}
						>
							<Icon className="h-5 w-5" />
							<span className="font-medium">{tab.label}</span>
						</a>
					);
				})}
			</div>

			<div className="p-4">
				<a
					href={"/chat"}
					className={`flex items-center space-x-3 p-3 rounded-lg w-full ${
						pathname === "/chat"
							? "bg-blue-500 text-white"
							: "bg-gray-500 text-white"
					}`}
				>
					<MessageSquareText className="h-8 w-8" />
					<span className="font-medium text-xl">Chat</span>
				</a>
			</div>
		</nav>
	);
}
