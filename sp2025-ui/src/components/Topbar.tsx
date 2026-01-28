import "./topbar.css";
import logo from "../assets/logoict-2.png"; // ✅ ปรับ path ให้ตรงโปรเจกต์คุณ

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbarLeft" />

      <div className="topbarRight">
        <div className="topbarBrand">
          {/* ✅ รูปโลโก้ */}
          <img className="miniLogo" src={logo} alt="TB-CERT x MUICT logo" />

          <div className="topbarTitle">
            TB-CERT x MUICT (Darknet Monitoring System)
          </div>
        </div>

        <button
          className="bellBtn"
          onClick={() => alert("Open notifications")}
          aria-label="Notifications"
          title="Notifications"
        >
          🔔
        </button>
      </div>
    </header>
  );
}
