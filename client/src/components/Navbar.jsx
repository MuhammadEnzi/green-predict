import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="bg-brand-dark/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold text-brand-green flex items-center gap-2 transition-opacity hover:opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0118 18c-1 .5-3 1-5 1s-4.5-1.343-5.657-2.343A8 8 0 0117.657 18.657z" /></svg>
            GreenPredict
          </Link>
          <div className="flex items-center space-x-2 md:space-x-4 bg-brand-dark-secondary/50 border border-white/10 rounded-full px-2 py-1">
            <NavLink to="/" className={({isActive}) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-brand-green text-white' : 'text-brand-gray hover:text-white'}`}>
              Beranda
            </NavLink>
            <NavLink to="/analyze" className={({isActive}) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-brand-green text-white' : 'text-brand-gray hover:text-white'}`}>
              Analisis Risiko
            </NavLink>
            <NavLink to="/timelens" className={({isActive}) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-brand-green text-white' : 'text-brand-gray hover:text-white'}`}>
              Lensa Waktu
            </NavLink>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;