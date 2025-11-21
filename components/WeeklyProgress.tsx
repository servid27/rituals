"use client";

export default function WeeklyProgress() {
  return (
    <div className="card w-full">
      <div className="flex items-center justify-between">
        <h3 className="card-title">Weekly Progress</h3>
        <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
          +12%
        </span>
      </div>
      <div className="subtext">
        Best day: Friday
        <br />
        Average: 77%
      </div>
      <div className="h-36 flex items-end justify-between gap-2">
        {[65, 78, 52, 89, 95, 72, 88].map((height, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full bg-[#772eee] rounded-t-md rounded-b-sm transition-all duration-500 hover:brightness-110 min-h-[8px]"
              style={{ height: `${Math.max(height * 0.8, 20)}px` }}
            ></div>
            <span className="text-subtext-light text-sm font-semibold">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
