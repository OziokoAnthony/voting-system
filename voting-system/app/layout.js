import Providers from "./providers";

export const metadata = {
  title: "Head of House Vote",
  description: "Next.js Voting Application Layout Wrapper",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f3f4f6", fontFamily: "sans-serif" }}>
        
        {/* Modern Top Navigation Bar */}
        <nav style={{
          backgroundColor: "green",
          padding: "15px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 100
        }}>
          <div style={{ fontWeight: "bold", fontSize: "1.85rem", color: "white", letterSpacing: "0.5px" }}>
            HACKATHON AFRICA 3.0 ELECTION E-PORTAL
          </div>
          <div style={{ display: "flex", gap: "25px" }}>
            <span style={{ color: "#ffffff", fontWeight: "500", fontSize: "0.95rem", cursor: "pointer" }}>Live Ballot</span>
            <span style={{ color: "#6b7280", fontWeight: "500", fontSize: "0.95rem", cursor: "not-allowed" }}>Archive</span>
            <span style={{ color: "#6b7280", fontWeight: "500", fontSize: "0.95rem", cursor: "not-allowed" }}>Rules</span>
          </div>
        </nav>
                  {/* Pass down the TanStack Client Provider layer to components */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
