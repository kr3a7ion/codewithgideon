// UI preview: renders app screens with sample data (no Firebase needed).
//   npm run preview:ui  ->  http://localhost:5174/student/dashboard?state=active&theme=dark
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "../src/index.css";
import StudentArea from "../src/features/learn/StudentArea";
import AdminArea from "../src/features/admin/AdminArea";
import { previewProfile } from "./mocks/data";

const Student = () => (
  <StudentArea
    profile={previewProfile}
    onNavigate={(view, data) => console.log("navigate", view, data)}
    onLogout={() => console.log("logout")}
  />
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/student/*" element={<Student />} />
        <Route
          path="/admin/*"
          element={<AdminArea onNavigate={() => undefined} onLogout={() => undefined} sessionRemainingMs={25 * 60_000} />}
        />
        <Route
          path="*"
          element={
            <div className="p-10">
              <p className="font-bold">Preview screens</p>
              <ul className="mt-3 list-disc pl-6">
                {["dashboard", "classes", "resources", "community", "chat", "notifications", "badges"].map((s) => (
                  <li key={s}>
                    <a className="text-teal-600 underline" href={`/student/${s}`}>/student/{s}</a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-slate-500">Add ?state=locked or ?state=empty and ?theme=dark.</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
