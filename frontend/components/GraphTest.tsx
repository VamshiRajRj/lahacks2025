"use client";

import Graph from "@/components/Graph";

export default function GraphTest() {
	const barYData = [
		{ value: 30, label: "Jan" },
		{ value: 45, label: "Feb" },
		{ value: 60, label: "Mar", marked: true },
		{ value: 20, label: "Apr" },
		{ value: 40, label: "May" },
		{ value: 30, label: "Jun" },
		{ value: 30, label: "Jul" },
		{ value: 30, label: "Aug" },
	];

	// const barXData = [
	// 	{ value: 30, label: "Eat" },
	// 	{ value: 15, label: "Gym" },
	// 	{ value: 50, label: "Code", marked: true },
	// 	{ value: 25, label: "Read" },
	// 	{ value: 40, label: "Run" },
	// ];

	return (
		<div className="flex flex-col gap-8 max-w-full">
			{/* Bar Y Graph */}
			<div className="flex flex-col items-center gap-2">
				{/* <div className="text-lg font-semibold text-gray-700">
					Vertical Bar Graph
				</div> */}
				<Graph
					type="bar-y"
					data={barYData}
					width={350}
					height={250}
					color="#3b82f6"
					markedColor="#ef4444"
				/>
			</div>

			{/* Bar X Graph */}
			{/* <div className="flex flex-col items-center gap-2">
				<div className="text-lg font-semibold text-gray-700">
					Horizontal Bar Graph
				</div>
				<Graph
					type="bar-x"
					data={barXData}
					width={350}
					height={220}
					color="#6366f1"
					markedColor="#ef4444"
				/>
			</div> */}
		</div>
	);
}
