import { Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />} />
      <Route path="/ferramenta/:slug" element={<AppShell />} />
    </Routes>
  );
}
