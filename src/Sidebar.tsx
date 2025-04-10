import { NavLink } from 'react-router-dom';
import { Home, Leaf, Activity, ShoppingBag, Stethoscope, UserCircle } from "lucide-react";

function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-md transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out z-50 md:hidden`}
    >
      <div className="pt-20">
        <nav className="mt-5">
          <ul className="space-y-4 px-4">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/remedies"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <Leaf className="h-5 w-5" />
                <span>Remedies</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/ailments"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <Activity className="h-5 w-5" />
                <span>Ailments</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/store"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Store</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/consult"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <Stethoscope className="h-5 w-5" />
                <span>Consult Doctor</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/ndashboard"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <UserCircle className="h-5 w-5" />
                <span>Dashboard</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;