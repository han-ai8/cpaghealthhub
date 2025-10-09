import React from "react";

const Home = () => {
  return (
    <div className="min-h-screen bg-blue-200 p-8 space-y-8">
      {/* Announcement Post */}
      <div className="bg-base-200 rounded-lg p-6 max-w-4xl mx-auto shadow">
        <h3 className="text-blue-800 font-semibold text-lg mb-2">ANNOUNCEMENT</h3>
        <p className="font-semibold text-gray-700">Description</p>
        <p className="mb-4 text-blue-600 cursor-pointer">Connect</p>

        <div className="flex items-center mb-4">
          <div className="avatar">
            <div className="w-10 rounded-full bg-red-500 flex justify-center items-center text-white font-bold">
              C
            </div>
          </div>
          <div className="ml-3">
            <p className="font-semibold text-blue-900">
              Cavite Positive Action Group The JCH Advocacy Inc.
            </p>
            <p className="text-xs text-gray-600">Just now</p>
          </div>
        </div>

        <div className="bg-red-400 rounded-lg h-32 flex items-center justify-center text-white font-semibold mb-4">
          Announcement Content
        </div>

        {/* Bottom actions */}
        <div className="flex space-x-6 text-sm text-blue-600 font-semibold cursor-pointer">
          <span>Reads</span>
          <span>Comment</span>
          <span>Save</span>
        </div>
      </div>

      {/* Post from Admin Side */}
      <div className="bg-base-200 rounded-lg p-6 max-w-4xl mx-auto shadow">
        <div className="flex items-center mb-4">
          <div className="avatar">
            <div className="w-10 rounded-full bg-red-500 flex justify-center items-center text-white font-bold">
              C
            </div>
          </div>
          <div className="ml-3">
            <p className="font-semibold text-blue-900">CPAG</p>
            <p className="text-xs text-gray-600">2h</p>
          </div>
        </div>

        <p className="mb-4 text-gray-700">
          Cavite Positive Action Group The JCH Advocacy Inc.
        </p>

        <div className="bg-red-400 rounded-lg h-32 flex items-center justify-center text-white font-semibold mb-4">
          Post Image/Content
        </div>

        {/* Bottom actions with icons */}
        <div className="flex space-x-6 text-gray-600">
          <button className="btn btn-ghost btn-sm gap-2 hover:text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            24
          </button>
          <button className="btn btn-ghost btn-sm gap-2 hover:text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16h6"
              />
            </svg>
            5 Comments
          </button>
          {/* Save Button */}
          <button className="btn btn-ghost btn-sm gap-2 hover:text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5v14l7-7 7 7V5H5z"
              />
            </svg>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;