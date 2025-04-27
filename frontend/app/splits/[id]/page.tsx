"use client";

import { useParams, useRouter } from "next/navigation";
import { useSplit, useTransactions, useUser } from "@/context/AppContext";
import { TransactionType } from "@/types/TransactionsType";
import { ArrowLeft } from "lucide-react"; // import back icon
import Link from "next/link";

export default function SplitTransactionsPage() {
	const params = useParams();
	const router = useRouter();
	const id = params?.id as string;
	const { transactions, loading } = useTransactions(id);
	const { split } = useSplit(id);
	const { user } = useUser();

	if (!id || loading) {
		return <div>Loading...</div>;
	}

	if (transactions.length === 0) {
		return (
			<div className="flex h-full bg-gray-50 items-center justify-center">
				<div className="text-gray-500">
					No transactions found for this split
				</div>
			</div>
		);
	}

	// Sort transactions by date DESCENDING before grouping
	const sortedTransactions = [...transactions].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	// Group transactions by month and week
	const groupedTransactions = sortedTransactions.reduce(
		(acc, transaction) => {
			const date = new Date(transaction.date);
			const monthYear = date.toLocaleString("default", {
				month: "long",
				year: "numeric",
			});
			const weekNumber = Math.ceil(date.getDate() / 7);
			const weekKey = `Week ${weekNumber}`;

			// Calculate week start and end dates
			const weekStart = new Date(date);
			weekStart.setDate(date.getDate() - date.getDay());
			const weekEnd = new Date(weekStart);
			weekEnd.setDate(weekStart.getDate() + 6);

			const dateRange = `${weekStart.getDate()} ${weekStart.toLocaleString(
				"default",
				{ month: "short" }
			)} - ${weekEnd.getDate()} ${weekEnd.toLocaleString("default", {
				month: "short",
			})}`;

			if (!acc[monthYear]) {
				acc[monthYear] = {};
			}
			if (!acc[monthYear][weekKey]) {
				acc[monthYear][weekKey] = {
					dateRange,
					transactions: [],
				};
			}
			acc[monthYear][weekKey].transactions.push(transaction);
			return acc;
		},
		{} as Record<
			string,
			Record<
				string,
				{ dateRange: string; transactions: TransactionType[] }
			>
		>
	);

	const formatTransactionDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			day: "numeric",
			month: "short",
		});
	};

	const getDebtStatus = (transaction: TransactionType) => {
		const userSplit = transaction.splits.find(
			(split) => split.person.id === user?.id
		);
		const userPaid = transaction.paidBy.find(
			(pay) => pay.person.id === user?.id
		);

		const totalPaidByUser = userPaid?.amount || 0;
		const userOwes = userSplit?.amount || 0;

		if (totalPaidByUser >= userOwes) {
			return {
				type: "owed",
				amount: totalPaidByUser - userOwes,
			};
		} else {
			return {
				type: "owe",
				amount: userOwes - totalPaidByUser,
			};
		}
	};

	return (
		<div className="flex h-full bg-gray-50">
			<main className="flex-1 flex flex-col">
				{/* Header with Back Button */}
				<div className="flex items-center gap-4 px-6 pt-4">
					<button
						onClick={() => router.back()}
						className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold"
					>
						<ArrowLeft className="h-6 w-6" />
						Split Details
					</button>
				</div>

				{/* Body */}
				<div className="flex flex-col flex-1 p-6 md:p-8 gap-2 mb-6 md:mb-0">
					<div className="flex justify-between items-center mb-5">
						<div>
							<h2 className="text-2xl font-bold text-gray-900">
								{split && split.name}
							</h2>
							<p className="text-gray-500 mt-1">
								{split && split.people?.length} people in this
								split
							</p>
						</div>
					</div>

					{/* Transactions List */}
					<div className="space-y-4">
						{Object.entries(groupedTransactions).map(
							([month, weeks]) => (
								<div
									key={month}
									className="bg-white rounded-lg border border-gray-300 overflow-hidden"
								>
									<div className="p-4 bg-gray-50">
										<h2 className="text-lg font-semibold text-gray-700">
											{month}
										</h2>
									</div>

									{Object.entries(weeks).map(
										([
											week,
											{ dateRange, transactions },
										]) => (
											<div key={week} className="">
												<div className="px-3 py-1 uppercase bg-gray-50 border-y border-gray-200 ">
													<h3 className="text-xs font-bold text-gray-400 flex justify-between items-center">
														<span className="mx-2">
															{week}
														</span>
														<span>{dateRange}</span>
													</h3>
												</div>
												<div className="divide-y divide-gray-400">
													{transactions.map(
														(transaction) => {
															const debtStatus =
																getDebtStatus(
																	transaction
																);
															return (
																<Link
																	key={
																		transaction.id
																	}
																	href={`/transactions/${transaction.id}`}
																>
																	<div className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-200">
																		<div className="flex items-center justify-between">
																			<div className="flex-1">
																				<div className="font-medium text-gray-900">
																					{
																						transaction.title
																					}
																				</div>
																				<div className="flex items-center gap-2 text-sm text-gray-500">
																					<span>
																						{formatTransactionDate(
																							transaction.date
																						)}
																					</span>
																					<span>
																						•
																					</span>
																					<span>
																						Paid
																						by{" "}
																						{transaction.paidBy
																							.map(
																								(
																									pay
																								) =>
																									pay
																										.person
																										.name
																							)
																							.join(
																								", "
																							)}
																					</span>
																				</div>
																			</div>

																			{/* Debt status */}
																			<div
																				className={`text-right font-medium ${
																					debtStatus.type ===
																					"owe"
																						? "text-red-600"
																						: "text-green-600"
																				}`}
																			>
																				{debtStatus.type ===
																				"owe" ? (
																					<>
																						<span className="text-xs">
																							You
																							owe
																						</span>
																						<br />

																						$
																						{debtStatus.amount.toFixed(
																							2
																						)}
																					</>
																				) : (
																					<>
																						<span className="text-xs">
																							You&apos;re
																							owed
																						</span>
																						<br />

																						$
																						{debtStatus.amount.toFixed(
																							2
																						)}
																					</>
																				)}
																			</div>
																		</div>
																	</div>
																</Link>
															);
														}
													)}
												</div>
											</div>
										)
									)}
								</div>
							)
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
