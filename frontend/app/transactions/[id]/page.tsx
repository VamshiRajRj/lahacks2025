"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTransactions, useSplits, useUser } from "@/context/AppContext";
import { ArrowLeft } from "lucide-react";

export default function TransactionDetailPage() {
	const router = useRouter();
	const { id } = useParams() as { id: string };
	const searchParams = useSearchParams();
	const { transactions } = useTransactions();
	const { splits } = useSplits();
	const { user } = useUser();

	const from = searchParams.get("from");

	const transaction = transactions.find((tx) => tx.id === Number(id));

	if (!transaction) {
		return <div>Transaction not found.</div>;
	}

	const split = splits.find((s) => s.id === transaction.splitId);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<div className="flex flex-col min-h-screen bg-[#f0f4f8]">
			{/* Header */}
			<div className="flex items-center gap-4 px-6 pt-4">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold"
				>
					<ArrowLeft className="h-6 w-6" />
					{from === "split"
						? "Split Transactions"
						: "All Transactions"}
				</button>
			</div>

			{/* Main Content */}
			<main className="flex-1 flex flex-col items-center p-6 md:p-8 gap-6">
				{/* Ticket */}
				<div className="bg-white w-full max-w-2xl rounded-2xl shadow-md p-6 flex flex-col gap-6 border border-dashed border-gray-300">
					{/* Title and Date */}
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900">
							{transaction.title}
						</h1>
						<p className="text-gray-600 mt-1 text-sm">
							{formatDate(transaction.date)}
						</p>
						{split && (
							<p className="text-gray-600 text-sm mt-1">
								Group:{" "}
								<span className="font-semibold">
									{split.name}
								</span>
							</p>
						)}
						{transaction.billLink && (
							<a
								href={transaction.billLink}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-block mt-3 text-blue-500 hover:underline text-sm"
							>
								View Full Bill
							</a>
						)}
					</div>

					{/* Separator */}
					<div className="border-t border-dashed border-gray-300"></div>

					{/* Items Section */}
					<div>
						<h2 className="text-lg font-semibold text-gray-800 mb-3">
							Items
						</h2>
						{transaction.items.length > 0 ? (
							<ul className="space-y-2">
								{transaction.items.map((item, index) => (
									<li
										key={index}
										className="flex justify-between text-gray-700 text-sm"
									>
										<span>{item.name}</span>
										<span>${item.price.toFixed(2)}</span>
									</li>
								))}
							</ul>
						) : (
							<p className="text-gray-500 text-sm">
								No items listed.
							</p>
						)}
					</div>

					{/* Separator */}
					<div className="border-t border-dashed border-gray-300"></div>

					{/* Split Section */}
					<div>
						<h2 className="text-lg font-semibold text-gray-800 mb-3">
							Split Details
						</h2>
						{transaction.splits.length > 0 ? (
							<ul className="space-y-2">
								{transaction.splits.map((splitEntry, index) => {
									const isUser =
										splitEntry.person.id === user?.id;
									return (
										<li
											key={index}
											className={`flex justify-between items-center text-sm ${
												isUser
													? "bg-red-50 p-2 -mx-2 rounded-md font-bold text-red-800"
													: "text-gray-700"
											}`}
										>
											<span>
												{isUser
													? "You"
													: splitEntry.person.name}
											</span>
											<span>
												${splitEntry.amount.toFixed(2)}
											</span>
										</li>
									);
								})}
							</ul>
						) : (
							<p className="text-gray-500 text-sm">
								No split data available.
							</p>
						)}
					</div>

					{/* Separator */}
					<div className="border-t border-dashed border-gray-300"></div>

					{/* Paid Section */}
					<div>
						<h2 className="text-lg font-semibold text-gray-800 mb-3">
							Who Paid
						</h2>
						{transaction.paidBy.length > 0 ? (
							<ul className="space-y-2">
								{transaction.paidBy.map((payer, index) => {
									const isUser = payer.person.id === user?.id;
									return (
										<li
											key={index}
											className={`flex justify-between items-center text-sm ${
												isUser
													? "bg-green-50 p-2 -mx-2 rounded-md font-bold text-green-800"
													: "text-gray-700"
											}`}
										>
											<span>
												{isUser
													? "You"
													: payer.person.name}
											</span>
											<span>
												${payer.amount.toFixed(2)}
											</span>
										</li>
									);
								})}
							</ul>
						) : (
							<p className="text-gray-500 text-sm">
								No payment records found.
							</p>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
