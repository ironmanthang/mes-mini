import { useState } from "react";
import { Sidebar } from "./components/ui/sidebar";
import { Header } from "./components/ui/header";

import { Dashboard } from "./screens/DashBoard";
import { UserAndSystem } from "./screens/UserAndSystem";
import { HumanResources } from "./screens/HumanResources";
import { Production } from "./screens/Production";
import { Warehouse } from "./screens/Warehouses";
import { Components } from "./screens/Components";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [userSystemTab, setUserSystemTab] = useState<"management" | "settings">("management");

  const handleSidebarNavigate = (pageName: string) => {
    setActivePage(pageName);
    if (pageName === "User & System") {
      setUserSystemTab("management");
    }
  };

  const handleHeaderNavigate = (pageName: string) => {
    setActivePage(pageName);
    if (pageName === "User & System") {
      setUserSystemTab("settings");
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "User & System":
        return <UserAndSystem tabType={userSystemTab}/>
      case "Human Resources":
        return <HumanResources />;
      case "Production":
        return <Production/>
      case "Warehouse":
        return <Warehouse/>
      case "Components":
        return <Components/>
      default:
        return <div className="p-8">Chức năng đang phát triển: {activePage}</div>;
    }
  };

  return (
    <div className="bg-white w-full min-h-screen flex [font-family:'Zen_Kaku_Gothic_Antique',Helvetica]">
      
      <Sidebar activePage={activePage} onNavigate={handleSidebarNavigate} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header onNavigate={handleHeaderNavigate}/>

        <div className="flex-1 overflow-auto bg-white">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}