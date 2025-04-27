"use client";

import { useTransactions, useSplits, useUser } from "@/context/AppContext";
import { TransactionType } from "@/types/TransactionsType";
import Link from "next/link";

export default function TransactionsPage() {
	const { transactions, loading: transactionsLoading } = useTransactions();
	const { splits, loading: splitsLoading } = useSplits();
	const { user } = useUser();

	// While loading
	if (transactionsLoading || splitsLoading) {
		return <div>Loading...</div>;
	}

	// Sort transactions by date DESCENDING before grouping
	const sortedTransactions = [...transactions].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	// Group transactions by month + week
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
		return date.toLocaleString("default", {
			weekday: "short",
			day: "numeric",
			month: "short",
		});
	};

	const getSplitName = (splitId: number) => {
		const split = splits.find((s) => s.id === splitId);
		return split ? split.name : "Unknown Group";
	};

	const getUserShare = (transaction: TransactionType) => {
		if (!user) return 0;

		const splitEntry = transaction.splits.find(
			(split) => split.person.id === user.id
		);

		return splitEntry ? -splitEntry.amount : 0;
	};

	return (
		<div className="flex h-full bg-gray-50">
			<main className="flex-1 flex flex-col">
				<div className="flex flex-col flex-1 p-6 md:p-8 gap-2 my-6 md:mb-0">
					<div className="flex justify-between items-center mb-5">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								My Bills
							</h1>
							<p className="text-gray-500 mt-1">
								Track all your expenses in one place
							</p>
						</div>
						{/* <button className="flex items-center gap-2 p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md">
							<PlusIcon className="h-5 w-5" />
						</button> */}
					</div>

					{/* Transactions List */}
					<div className="space-y-8">
						{Object.entries(groupedTransactions).map(
							([month, weeks]) => (
								<div
									key={month}
									className="bg-white rounded-lg shadow-sm overflow-hidden"
								>
									<div className="p-4 bg-gray-50 border-b border-gray-200">
										<h2 className="text-lg font-semibold text-gray-700">
											{month}
										</h2>
									</div>
									{Object.entries(weeks).map(
										([
											week,
											{ dateRange, transactions },
										]) => (
											<div
												key={week}
												className="border-b border-gray-100 last:border-b-0"
											>
												<div className="px-3 py-1 uppercase bg-gray-50">
													<h3 className="text-xs font-bold text-gray-400 flex justify-between items-center">
														<span className="mx-2">
															{week}
														</span>
														<span>{dateRange}</span>
													</h3>
												</div>
												<div className="divide-y divide-gray-100">
													{transactions.map(
														(transaction) => (
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
																			<div className="flex flex-col text-sm text-gray-500 mt-1">
																				<div className="flex gap-2">
																					<span>
																						{formatTransactionDate(
																							transaction.date
																						)}
																					</span>
																					<span>
																						•
																					</span>
																					<span className="capitalize">
																						{transaction.transactionType.toLowerCase()}
																					</span>
																				</div>
																				<div className="flex gap-2 mt-1">
																					<span className="font-semibold">
																						Group:
																					</span>
																					<span>
																						{getSplitName(
																							transaction.splitId
																						)}
																					</span>
																				</div>
																			</div>
																		</div>

																		{/* Show user's share */}
																		<div
																			className={`font-medium ${
																				getUserShare(
																					transaction
																				) >=
																				0
																					? "text-green-600"
																					: "text-red-600"
																			}`}
																		>
																			$
																			{Math.abs(
																				getUserShare(
																					transaction
																				)
																			).toFixed(
																				2
																			)}
																		</div>
																	</div>
																</div>
															</Link>
														)
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
