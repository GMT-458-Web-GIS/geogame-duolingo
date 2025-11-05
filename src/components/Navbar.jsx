import React from 'react';
import './Navbar.css';

const Navbar = ({ isDarkMode, onHomeClick, onLeadershipClick, onOptionsClick }) => {
  return (
    <nav className={`bottombar ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="bottombar-icons">
        <div className="icon-item" onClick={onHomeClick}>
          <img src="/assets/images/components/home_button.svg" alt="Ana Sayfa" className="icon-svg" />
        </div>

        <div className="icon-item" onClick={onLeadershipClick}>
          <img src="/assets/images/components/leadership_button.svg" alt="Sıralama" className="icon-svg" />
        </div>
        
        <div className="icon-item" onClick={onOptionsClick}>
          <img src="/assets/images/components/options_button.svg" alt="Seçenekler" className="icon-svg" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
