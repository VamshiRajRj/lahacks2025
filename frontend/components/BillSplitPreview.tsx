"use client";

import { TransactionType } from "@/types/TransactionType";
import { useUser } from "@/context/AppContext";

interface BillSplitPreviewProps {
	transaction: TransactionType;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function BillSplitPreview({
	transaction,
	onConfirm,
	onCancel,
}: BillSplitPreviewProps) {
	const { user } = useUser();

	return (
		<div className="bg-white w-full max-w-2xl rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col gap-6">
			{/* Title and Date */}
			<div className="text-center">
				<h1 className="text-2xl font-bold text-gray-900">
					{transaction.title}
				</h1>
				<p className="text-gray-600 text-sm mt-1">
					{transaction.transactionType}
				</p>
				<p className="text-gray-600 text-sm mt-1">
					${transaction.billAmount.toFixed(2)} total
				</p>
				<p className="text-gray-600 text-sm mt-1">{transaction.date}</p>
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

			{/* Items */}
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
					<p className="text-gray-500 text-sm">No items listed.</p>
				)}
			</div>

			{/* Separator */}
			<div className="border-t border-dashed border-gray-300"></div>

			{/* Split Details */}
			<div>
				<h2 className="text-lg font-semibold text-gray-800 mb-3">
					Split Details
				</h2>
				{transaction.splits.length > 0 ? (
					<ul className="space-y-2">
						{transaction.splits.map(
							(splitEntry: TransactionType, index: number) => {
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
							}
						)}
					</ul>
				) : (
					<p className="text-gray-500 text-sm">
						No split data available.
					</p>
				)}
			</div>

			{/* Separator */}
			<div className="border-t border-dashed border-gray-300"></div>

			{/* Who Paid */}
			<div>
				<h2 className="text-lg font-semibold text-gray-800 mb-3">
					Who Paid
				</h2>
				{transaction.paidBy.length > 0 ? (
					<ul className="space-y-2">
						{transaction.paidBy.map(
							(
								payer: TransactionType["paidBy"],
								index: number
							) => {
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
											{isUser ? "You" : payer.person.name}
										</span>
										<span>${payer.amount.toFixed(2)}</span>
									</li>
								);
							}
						)}
					</ul>
				) : (
					<p className="text-gray-500 text-sm">
						No payment records found.
					</p>
				)}
			</div>

			{/* Confirm / Cancel Buttons */}
			<div className="flex gap-4 justify-center mt-4">
				<button
					onClick={onCancel}
					className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
				>
					Cancel
				</button>
				<button
					onClick={onConfirm}
					className="px-6 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 text-sm"
				>
					Confirm
				</button>
			</div>
		</div>
	);
}
