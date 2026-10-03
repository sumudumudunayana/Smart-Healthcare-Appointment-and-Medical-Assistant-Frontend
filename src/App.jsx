import { Toaster } from "sonner";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <>
      <AppRoutes />

      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3000}
      />
    </>
  );
}

export default App;