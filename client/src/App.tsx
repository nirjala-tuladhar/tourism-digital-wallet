import { useEffect, useState } from "react";
import { apiClient } from "./api/client";

type HealthResponse = {
  status: string;
  message: string;
};

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const data = await apiClient.get<HealthResponse>("/api/health");
        setHealth(data);
      } catch (error) {
        console.error("Failed to connect to backend:", error);
      }
    };

    checkBackend();
  }, []);

  return (
    <div>
      <h1>Tourism Digital Wallet</h1>

      {health && (
        <div>
          <p>Status: {health.status}</p>
          <p>{health.message}</p>
        </div>
      )}
    </div>
  );
}

export default App;