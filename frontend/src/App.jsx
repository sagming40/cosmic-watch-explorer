import { useEffect } from "react";
import { ensureCsrf } from "./api/client";

function App() {
  useEffect(() => {
    ensureCsrf().catch((err) => {
      console.log("code:", err.code, "status:", err.status);
    });
  }, []);

  return <h1>COSMIC WATCH</h1>;
}

export default App;
