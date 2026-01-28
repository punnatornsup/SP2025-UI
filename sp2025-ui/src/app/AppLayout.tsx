import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import "./layout.css";

export default function AppLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div
      className="appRoot"
      style={
        {
          // ✅ เปลี่ยนความกว้าง sidebar แล้ว main/topbar จะตาม เพราะ layout.css ใช้ var นี้อยู่แล้ว
          ["--sidebar-w" as any]: sidebarExpanded ? "240px" : "84px",
        } as React.CSSProperties
      }
    >
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />

      <div className="appMain">
        <div className="topbarShell">
          <Topbar />
        </div>

        <main className="appContent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
