import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FraudCases from './pages/FraudCases';
import RiskRules from './pages/RiskRules';
import Decisions from './pages/Decisions';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={<RequireAuth />}>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="cases" element={<FraudCases />} />
                            <Route path="rules" element={<RiskRules />} />
                            <Route path="decisions" element={<Decisions />} />
                            <Route path="profile-check" element={<UserProfile />} />
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
