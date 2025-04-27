"use client";

import Graph from "@/components/Graph";

// Sample data for different graph types
const lineData = [
	{ value: 10 },
	{ value: 20 },
	{ value: 15 },
	{ value: 25 },
	{ value: 30, marked: true, label: "Peak" },
];

const barYData = [
	{ value: 30 },
	{ value: 45 },
	{ value: 60, marked: true, label: "Max" },
	{ value: 20 },
	{ value: 40 },
	{ value: 30 },
	{ value: 30 },
	{ value: 30 },
];

const barXData = [
	{ value: 0.7, label: "Food" },
	{ value: 0.5, label: "Travel" },
	{ value: 0.9, marked: true, label: "Rent" },
	{ value: 0.3, label: "Shopping" },
	{ value: 0.3, label: "Shopping2" },
	{ value: 0.3, label: "Shopping3" },
	{ value: 0.3, label: "Shopping4" },
];

export default function StatsPage() {
	return (
		<div className="p-6 md:p-8 space-y-8">
			{/* Full width graphs */}
			<div className="space-y-8">
				<div>
					<h2 className="text-lg font-medium text-gray-900 mb-4">
						Monthly Expenses Trend
					</h2>
					<div className="bg-white rounded-xl p-6">
						<Graph
							type="line"
							data={lineData}
							width={800}
							height={300}
							className="w-full"
						/>
					</div>
				</div>

				<div>
					<h2 className="text-lg font-medium text-gray-900 mb-4">
						Category-wise Spending
					</h2>
					<div className="bg-white rounded-xl p-6">
						<Graph
							type="bar-y"
							data={barYData}
							width={800}
							height={300}
							className="w-full"
						/>
					</div>
				</div>

				<div>
					<h2 className="text-lg font-medium text-gray-900 mb-4">
						Expense Distribution
					</h2>
					<div className="bg-white rounded-xl p-6">
						<Graph
							type="bar-x"
							data={barXData}
							width={800}
							height={200}
							className="w-full"
						/>
					</div>
				</div>
			</div>

			{/* Side by side graphs */}
			<div className="grid grid-cols-2 md:grid-cols-2 gap-8">
				<div>
					<h2 className="text-lg font-medium text-gray-900 mb-4">
						Weekly Trend
					</h2>
					<div className="bg-white rounded-xl p-6">
						<Graph
							type="line"
							data={lineData}
							width={400}
							height={200}
							className="w-full"
						/>
					</div>
				</div>

				<div>
					<h2 className="text-lg font-medium text-gray-900 mb-4">
						Category Split
					</h2>
					<div className="bg-white rounded-xl p-6">
						<Graph
							type="bar-y"
							data={barYData}
							width={400}
							height={200}
							className="w-full"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
