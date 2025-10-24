import React from "react";
import VolunteerDashboard from "./components/VolunteerDashboard";

function App() {
  const dummyUser = {
    name: "Aaradhya",
    hours: 42,
    status: "Active"
  };

  const handleLogout = () => {
    alert("Logged out!");
  };

  return (
    <div>
      <VolunteerDashboard user={dummyUser} onLogout={handleLogout} />
    </div>
  );
}

export default App;
