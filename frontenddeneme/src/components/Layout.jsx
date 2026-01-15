import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, ShieldAlert, FileText, Activity, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold flex items-center">
                        <span className="text-blue-500 mr-2">🛡️</span> TrustShield
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/" className="flex items-center p-3 rounded hover:bg-slate-800 transition">
                        <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
                    </Link>

                    <Link to="/decisions" className="flex items-center p-3 rounded hover:bg-slate-800 transition">
                        <Activity className="w-5 h-5 mr-3" /> Decisions
                    </Link>

                    {user?.role === 'ADMIN' && (
                        <>
                            <Link to="/cases" className="flex items-center p-3 rounded hover:bg-slate-800 transition">
                                <ShieldAlert className="w-5 h-5 mr-3" /> Fraud Cases
                            </Link>
                            <Link to="/rules" className="flex items-center p-3 rounded hover:bg-slate-800 transition">
                                <FileText className="w-5 h-5 mr-3" /> Risk Rules
                            </Link>
                            <Link to="/profile-check" className="flex items-center p-3 rounded hover:bg-slate-800 transition">
                                <Users className="w-5 h-5 mr-3" /> User Lookup
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.email}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center p-2 rounded bg-slate-800 hover:bg-red-900/50 text-gray-300 hover:text-white transition"
                    >
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
