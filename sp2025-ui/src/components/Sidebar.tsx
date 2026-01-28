import { NavLink } from "react-router-dom";
import { LayoutDashboard, Bot, Gavel, Settings } from "lucide-react";
import "./sidebar.css";
import logo from "../assets/tb-cert_logo.png";

type Props = {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
};

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { to: "/crawler-manager", label: "Crawler Manager", icon: <Bot size={20} /> },
  { to: "/rule-manager", label: "Rule Manager", icon: <Gavel size={20} /> },
  { to: "/settings", label: "Settings", icon: <Settings size={20} /> },
];

export default function Sidebar({ expanded, setExpanded }: Props) {
  return (
    <aside
      className={`sidebar ${expanded ? "sidebar--expanded" : ""}`}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* ✅ Logo ไม่ trigger expand (ไม่มี onMouseEnter ที่นี่) */}
      <div className="sidebarLogo" title="TB-CERT x MUICT">
        <div className="logoBox">
          <img className="logoImg" src={logo} alt="TB-CERT logo" />
        </div>

        {/* (Optional) ถ้าอยากให้ตอน expanded มีชื่อหน่วยงานใต้โลโก้ */}
        <div className="logoText">
          <div className="logoTextTop">TB-CERT x MUICT</div>
        </div>
      </div>

      <nav className="sidebarNav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `navIconBtn ${isActive ? "active" : ""}`
            }
            title={item.label}
            aria-label={item.label}
            onMouseEnter={() => setExpanded(true)}
            onFocus={() => setExpanded(true)}
          >
            <span className="navIcon">{item.icon}</span>
            <span className="navLabel">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
