import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke } from 'ol/style';
import './Main.css';

const Main = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null); // 'header2', 'header1', 'header'
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [checkState, setCheckState] = useState('unchecked'); // 'unchecked', 'checked', 'correct', 'incorrect'
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);
  let highlightFeature = null;

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const startLevel = (section) => {
    setCurrentLevel(section);
    setGameStarted(true);
    // Zoom animasyonunu section'a göre yap
    const zoomConfigs = {
      header2: { center: fromLonLat([15, 50]), zoom: 4 }, // Avrupa
      header1: { center: fromLonLat([-90, 0]), zoom: 3 }, // Amerika
      header: { center: fromLonLat([100, 35]), zoom: 3 } // Asya
    };
    
    if (mapInstanceRef.current && zoomConfigs[section]) {
      mapInstanceRef.current.getView().animate({
        ...zoomConfigs[section],
        duration: 1000
      });
    }
  };

  const handleAnswerSelect = (flagIndex) => {
    setSelectedAnswer(flagIndex);
    setCheckState('checked');
  };

  const handleCheckClick = () => {
    if (selectedAnswer !== null) {
      setIsAnswerChecked(true);
      // Doğru/yanlış kontrolü burada yapılacak
    }
  };

  const startGame = () => {
    setGameStarted(true);
    // Haritayı Avrupa'ya zoomla
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat([15, 50]), // Avrupa merkezi
        zoom: 4,
        duration: 1000
      });
    }
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      // Açık moda geçerken kapanış animasyonunu başlat
      setIsClosing(true);
      // Animasyonun bitmesini bekle (0.8s)
      setTimeout(() => {
        setIsDarkMode(false);
        setIsClosing(false);
      }, 800);
    } else {
      // Karanlık moda geçerken direkt değiştir (açılış animasyonu CSS'den gelir)
      setIsDarkMode(true);
    }
  };

  const handleHomeClick = () => {
    setShowLeaderboard(false);
    setGameStarted(false);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
  };

  const handleLeadershipClick = () => {
    setShowLeaderboard(true);
  };

  const handleOptionsClick = () => {
    // Bu fonksiyonu sonra ekleyeceğiz
    console.log('Options clicked');
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // GeoJSON vektör katmanı oluştur
    const vectorSource = new VectorSource({
      url: './databases/maps/custom.geo.json',
      format: new GeoJSON()
    });
    vectorSourceRef.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: '#666',
          width: 1
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.1)'
        })
      })
    });
    vectorLayerRef.current = vectorLayer;

    // OpenLayers harita oluştur
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: fromLonLat([0, 45]), // Merkezi yukarı kaldır (20'den 35'e)
        zoom: 1.8
      }),
      // Mouse interaksiyonlarını kapat
      interactions: [],
      controls: [] // Kontrolleri de kapat
    });

    // Mouse hover event'i ekle
    let hoverFeature = null;
    const highlightStyle = new Style({
      stroke: new Stroke({
        color: '#89e219',
        width: 3
      }),
      fill: new Fill({
        color: 'rgba(137, 226, 25, 0.6)'
      })
    });

    map.on('pointermove', (evt) => {
      if (hoverFeature) {
        hoverFeature.setStyle(undefined);
        hoverFeature = null;
      }

      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        hoverFeature = feature;
        feature.setStyle(highlightStyle);
        return true;
      });
    });

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(null);
      }
    };
  }, []);

  return (
    <div className={`main-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="top-bar">
        <div className="stats-container">
          <div className="stat-item">
            <img src="/assets/images/components/streak_button.svg" alt="Streak" className="stat-icon" />
            <span className="stat-value">0</span>
          </div>
          <div className="stat-item">
            <img src="/assets/images/components/gem_button.svg" alt="Gems" className="stat-icon" />
            <span className="stat-value">1200</span>
          </div>
          <div className="stat-item">
            <img src="/assets/images/components/health_button.svg" alt="Health" className="stat-icon" />
            <span className="stat-value">5</span>
          </div>
        </div>
      </div>
      <Navbar 
        isDarkMode={isDarkMode} 
        onHomeClick={handleHomeClick}
        onLeadershipClick={handleLeadershipClick}
        onOptionsClick={handleOptionsClick}
      />
      <div className="dark-mode-toggle" onClick={toggleDarkMode}>
        {isDarkMode ? (
          <img src="/images/duo/icon.svg" alt="Light Mode" className="dark-mode-icon" />
        ) : (
          <img src="/images/duo/icon-dark.svg" alt="Dark Mode" className="dark-mode-icon" />
        )}
      </div>
      <div className={`follow-banner ${isDarkMode ? 'slide-in' : ''} ${isClosing && isDarkMode ? 'slide-out' : ''}`}>
        <div className="follow-banner-content">
          <img src="/images/duo/follow_for_more.png" alt="Follow for more" className="follow-image" />

          <a href="https://github.com/kaanklcrsln" target="_blank" rel="noopener noreferrer" className="follow-button-link">
            <img src="/images/duo/follow_button.png" alt="Follow button" className="follow-button" />
          </a>

        </div>
      </div>
      <div className="main-content">
        <div className="hover-container left-panel">
          {showLeaderboard ? (
            <div className="leaderboard">
              <h3>Sıralama Tablosu</h3>
              <div className="leaderboard-item">
                <span className="rank">1.</span>
                <span className="name">Kullanıcı 1</span>
                <span className="score">1250</span>
              </div>
              <div className="leaderboard-item">
                <span className="rank">2.</span>
                <span className="name">Kullanıcı 2</span>
                <span className="score">980</span>
              </div>
              <div className="leaderboard-item">
                <span className="rank">3.</span>
                <span className="name">Kullanıcı 3</span>
                <span className="score">750</span>
              </div>
              <div className="leaderboard-item">
                <span className="rank">4.</span>
                <span className="name">Kullanıcı 4</span>
                <span className="score">620</span>
              </div>
              <div className="leaderboard-item">
                <span className="rank">5.</span>
                <span className="name">Kullanıcı 5</span>
                <span className="score">450</span>
              </div>
            </div>
          ) : (
            <>
              {!gameStarted ? (
                <div className="level-path-container">
                  {/* Header 2 - Top Level */}
                  <div className={`level-section ${openSection === 'header2' ? 'open' : ''}`}>
                    <div className="header-wrapper" onClick={() => toggleSection('header2')}>
                      <img src="/images/players/blonde-kid.svg" alt="Blonde Kid" className="character-image" />
                      <img src="/images/duo/level_path/Header (2).png" alt="Header 2" className="header-image" />
                    </div>
                    {openSection === 'header2' && (
                      <div className="level-content">
                        <button className="level-button div-button" title="Div Challenge" onClick={() => startLevel('header2')}>
                          <img src="/images/duo/level_path/div.png" alt="Div" />
                        </button>
                        <button className="level-button story-button" title="Story 1">
                          <img src="/images/duo/level_path/Story.png" alt="Story 1" />
                        </button>
                        <button className="level-button story-button" title="Story 2">
                          <img src="/images/duo/level_path/Story.png" alt="Story 2" />
                        </button>
                        <button className="level-button story-button" title="Story 3">
                          <img src="/images/duo/level_path/Story.png" alt="Story 3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Header 1 - Bottom Level */}
                  <div className={`level-section ${openSection === 'header1' ? 'open' : ''}`}>
                    <div className="header-wrapper" onClick={() => toggleSection('header1')}>
                      <img src="/images/players/afro-woman.svg" alt="Afro Woman" className="character-image" />
                      <img src="/images/duo/level_path/Header (1).png" alt="Header 1" className="header-image" />
                    </div>
                    {openSection === 'header1' && (
                      <div className="level-content">
                        <button className="level-button div-button" title="Div Challenge" onClick={() => startLevel('header1')}>
                          <img src="/images/duo/level_path/div.png" alt="Div" />
                        </button>
                        <button className="level-button story-button" title="Story 1">
                          <img src="/images/duo/level_path/Story.png" alt="Story 1" />
                        </button>
                        <button className="level-button story-button" title="Story 2">
                          <img src="/images/duo/level_path/Story.png" alt="Story 2" />
                        </button>
                        <button className="level-button story-button" title="Story 3">
                          <img src="/images/duo/level_path/Story.png" alt="Story 3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Header - Final Level */}
                  <div className={`level-section ${openSection === 'header' ? 'open' : ''}`}>
                    <div className="header-wrapper" onClick={() => toggleSection('header')}>
                      <img src="/images/players/purple-girl.svg" alt="Purple Girl" className="character-image" />
                      <img src="/images/duo/level_path/Header.png" alt="Header" className="header-image" />
                    </div>
                    {openSection === 'header' && (
                      <div className="level-content">
                        <button className="level-button div-button" title="Div Challenge" onClick={() => startLevel('header')}>
                          <img src="/images/duo/level_path/div.png" alt="Div" />
                        </button>
                        <button className="level-button story-button" title="Story 1">
                          <img src="/images/duo/level_path/Story.png" alt="Story 1" />
                        </button>
                        <button className="level-button story-button" title="Story 2">
                          <img src="/images/duo/level_path/Story.png" alt="Story 2" />
                        </button>
                        <button className="level-button story-button" title="Story 3">
                          <img src="/images/duo/level_path/Story.png" alt="Story 3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="game-ui">
                      {/* Soru Kısımı */}
                      <div className="question-section">
                        <img src="/images/duo/Image & Audio.png" alt="Question" className="question-image" />
                        
                        {/* 4 Bayrak Seçeneği */}
                        <div className="flag-options-game">
                          <div className={`flag-option ${selectedAnswer === 0 ? 'selected' : ''}`} onClick={() => handleAnswerSelect(0)}>
                            <img src="/images/duo/level_path/Story.png" alt="Option 1" />
                          </div>
                          <div className={`flag-option ${selectedAnswer === 1 ? 'selected' : ''}`} onClick={() => handleAnswerSelect(1)}>
                            <img src="/images/duo/level_path/Story.png" alt="Option 2" />
                          </div>
                          <div className={`flag-option ${selectedAnswer === 2 ? 'selected' : ''}`} onClick={() => handleAnswerSelect(2)}>
                            <img src="/images/duo/level_path/Story.png" alt="Option 3" />
                          </div>
                          <div className={`flag-option ${selectedAnswer === 3 ? 'selected' : ''}`} onClick={() => handleAnswerSelect(3)}>
                            <img src="/images/duo/level_path/Story.png" alt="Option 4" />
                          </div>
                        </div>

                        {/* Check Button */}
                        <button className="check-button" onClick={handleCheckClick} disabled={selectedAnswer === null}>
                          <img 
                            src={selectedAnswer !== null ? '/images/duo/check-2.png' : '/images/duo/check-1.png'} 
                            alt="Check" 
                          />
                        </button>

                      </div>
                    </div>
                  )}
            </>
          )}
          
          {/* Sonuç Gösterimi - Left Panel Alt */}
          {isAnswerChecked && (
            <div className={`result-message ${checkState === 'correct' ? 'correct' : 'incorrect'}`}>
              <img 
                src={checkState === 'correct' ? '/images/duo/true.png' : '/images/duo/false.png'} 
                alt="Result" 
              />
            </div>
          )}
        </div>
        <div className="hover-container center-panel">
          <div ref={mapRef} className="map-container"></div>
        </div>
      </div>
    </div>
  );
};

export default Main;
