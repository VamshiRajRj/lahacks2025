"use client";

import GraphTest from "@/components/GraphTest";
import Splits from "../components/Splits";

import { useUser } from "@/context/AppContext";

export default function DashboardPage() {
	const { user } = useUser();
	return (
		<div className="flex h-full bg-gray-50">
			{/* Main content area */}
			<main className="flex-1 flex flex-col">
				<div className="flex flex-col flex-1 p-6 md:p-8 gap-2 mt-6">
					<h1 className="text-gray-700 font-medium text-xl mb-3">
						Welcome back, {user?.name}!
					</h1>
					<div className="flex flex-col gap-2 md:flex-row-reverse md:items-start">
						<div className="mt-6 md:mt-0 -mx-3">
							<GraphTest />
						</div>
						<div className="text-2xl font-medium text-gray-900 mr-6 mt-10">
							Your net worth increased by exactly one houseplant
							this month. <br />
							At least it&apos;s still alive! 🪴
						</div>
					</div>

					<Splits />
				</div>

				{/* <ChatPrompt onCameraClick={() => setCameraOpen(true)} /> */}
			</main>

			{/* Camera Modal */}
			{/* <CameraModal
				open={cameraOpen}
				onClose={() => setCameraOpen(false)}
			/> */}
		</div>
	);
}
