"use client";

import GroupItem from "@/components/GroupItem";
import { useSplits } from "@/context/AppContext";

export default function Splits() {
	const { splits, loading } = useSplits();

	return (
		<div className="mt-12">
			<div className="flex justify-between items-center mb-5">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Splits</h1>
					<p className="text-gray-500 mt-1">
						Manage your groups & personal splits
					</p>
				</div>
				{/* <button className="flex items-center gap-2 p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md">
					<Plus className="h-5 w-5" />
				</button> */}
			</div>
			{!loading && (
				<div className="">
					{splits.map((split) => (
						<GroupItem key={split.id} split={split} />
					))}
				</div>
			)}
		</div>
	);
}
