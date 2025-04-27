"use client";

import { SplitType } from "@/types/SplitType";
import { UsersIcon, UserIcon } from "lucide-react";
import Link from "next/link";

interface GroupItemProps {
	split: SplitType;
}

export default function GroupItem({ split }: GroupItemProps) {
	return (
		<Link href={`/splits/${split.id}`} className="block">
			<div className="group flex items-center justify-between py-5 border-b border-gray-300 hover:bg-gray-50 transition-colors">
				<div className="flex items-center gap-3">
					<div
						className={`p-3 border border-gray-300 ${
							split.people.length > 2
								? "rounded-lg"
								: "rounded-full"
						} group-hover:bg-gray-100 transition-colors`}
					>
						{split.people.length > 2 ? (
							<UsersIcon className="h-6 w-6 text-gray-500" />
						) : (
							<UserIcon className="h-6 w-6 text-gray-500" />
						)}
					</div>
					<div className="">
						<h3 className="font-semibold text-gray-900 text-lg">
							{split.name}
						</h3>
						<span className="text-sm text-gray-500">
							{split && split.people?.length} people in this split
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
