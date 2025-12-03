import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getNavLinks = () => {
    if (!user) return [];

    const baseLink = `/${user.role}`;

    if (user.role === "student") {
      return [
        { name: "Dashboard", path: `${baseLink}/dashboard` },
        { name: "Courses", path: `${baseLink}/courses` },
        { name: "Marks", path: `${baseLink}/marks` },
        { name: "Attendance", path: `${baseLink}/attendance` },
        { name: "Fees", path: `${baseLink}/fees` },
        { name: "Transcript", path: `${baseLink}/transcript` },
      ];
    } else if (user.role === "faculty") {
      return [
        { name: "Dashboard", path: `${baseLink}/dashboard` },
        { name: "Attendance", path: `${baseLink}/attendance` },
        { name: "Grades", path: `${baseLink}/grades` },
        { name: "Announcements", path: `${baseLink}/announcements` },
        { name: "Leaves", path: `${baseLink}/leaves` },
      ];
    } else if (user.role === "admin") {
      return [
        { name: "Dashboard", path: `${baseLink}/dashboard` },
        { name: "Students", path: `${baseLink}/students` },
        { name: "Faculty", path: `${baseLink}/faculty` },
        { name: "Courses", path: `${baseLink}/courses` },
        { name: "Fees", path: `${baseLink}/fees` },
        { name: "Leaves", path: `${baseLink}/leaves` },
        { name: "Announcements", path: `${baseLink}/announcements` },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-zinc-900 border-b border-gray-800 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Student Portal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            <div className="hidden md:flex md:items-center md:space-x-4">
              <div className="flex items-center text-sm text-gray-300">
                <User className="h-5 w-5 mr-2 text-blue-400" />
                <span className="font-medium text-white">{user?.username}</span>
                <span className="ml-2 px-2.5 py-1 text-xs rounded-full bg-blue-600 text-white border border-blue-500 font-semibold">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-zinc-800"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-zinc-900">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  location.pathname === link.path
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-800">
              <div className="px-3 py-2 text-sm text-gray-300">
                Logged in as{" "}
                <strong className="text-white">{user?.username}</strong>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-base font-medium text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
