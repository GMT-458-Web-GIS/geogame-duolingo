import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';

const Intro = () => {
  const [showDuolingo, setShowDuolingo] = useState(false);
  const [showGIS, setShowGIS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fade in animations
    setTimeout(() => setShowDuolingo(true), 100);
    setTimeout(() => setShowGIS(true), 1100);
  }, []);

  const handleClick = () => {
    navigate('/main');
  };

  return (
    <div className="intro-container" onClick={handleClick}>
      <div className="intro-content">
        <h1 className="intro-title">
          <span className={`duolingo-text ${showDuolingo ? 'fade-in' : ''}`}>
            duolingo
          </span>
          <span className={`gis-text ${showGIS ? 'fade-in' : ''}`}>
            GIS
          </span>
        </h1>
      </div>
    </div>
  );
};

export default Intro;
