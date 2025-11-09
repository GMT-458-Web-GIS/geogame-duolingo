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
import { countryData, getFlagUrl, getRandomCountries, getRandomCountry } from '../data/countryData';

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
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null); // Mevcut soru için ülke
  const [flagOptions, setFlagOptions] = useState([]); // 4 bayrak seçeneği
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null); // Doğru cevabın index'i
  const [correctlyAnsweredCountries, setCorrectlyAnsweredCountries] = useState([]); // Doğru bilinen ülkeler
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const tileLayerRef = useRef(null); // OSM tile layer referansı
  let highlightFeature = null;

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const highlightCountryOnMap = (countryName) => {
    if (!vectorLayerRef.current) return;

    // Style fonksiyonu: ülkeleri durumlarına göre renklendir
    const styleFunction = (feature) => {
      const featureName = feature.get('name') || feature.get('NAME') || feature.get('admin');
      const isTargetCountry = featureName && featureName.toLowerCase().includes(countryName.toLowerCase());
      const isCorrectlyAnswered = correctlyAnsweredCountries.some(country => 
        featureName && featureName.toLowerCase().includes(country.toLowerCase())
      );
      
      let fillColor = 'rgba(255, 255, 255, 0.1)'; // Varsayılan renk
      
      if (isCorrectlyAnswered) {
        fillColor = '#58cc02'; // Doğru bilinen ülkeler yeşil
      } else if (isTargetCountry) {
        fillColor = '#ffc800'; // Mevcut soru sarı
      }
      
      return new Style({
        stroke: new Stroke({
          color: '#666',
          width: 1
        }),
        fill: new Fill({
          color: fillColor
        })
      });
    };

    vectorLayerRef.current.setStyle(styleFunction);
  };

  const loadContinentMap = (section) => {
    // Section'a göre JSON dosya yolunu belirle
    const geoJsonPaths = {
      header2: '/databases/maps/europe.json',    // Europe
      header1: '/databases/maps/america.json',   // Americas
      header: '/databases/maps/asia.json'        // Asia
    };

    const geoJsonPath = geoJsonPaths[section];
    
    if (!geoJsonPath || !vectorSourceRef.current) return;

    // Sadece vektör katmanını fade-out yap (OSM kalsın)
    if (vectorLayerRef.current) {
      vectorLayerRef.current.setOpacity(0);
    }

    // 500ms sonra GeoJSON'ı değiştir ve fade-in yap
    setTimeout(() => {
      // Yeni GeoJSON'ı yükle
      const newSource = new VectorSource({
        url: geoJsonPath,
        format: new GeoJSON()
      });

      // Eski source'u yeni ile değiştir
      if (vectorLayerRef.current) {
        vectorLayerRef.current.setSource(newSource);
        vectorSourceRef.current = newSource;
        
        // Fade-in animasyonu başlat
        vectorLayerRef.current.setOpacity(0);
        setTimeout(() => {
          if (vectorLayerRef.current) {
            vectorLayerRef.current.setOpacity(1);
          }
        }, 10);
      }
    }, 10);
  };

  const startLevel = (section) => {
    setCurrentLevel(section);
    setGameStarted(true);
    
    // İlgili kıta haritasını yükle (fade-out/fade-in ile)
    loadContinentMap(section);
    
    // Bu section için rastgele bir ülke seç (doğru cevap)
    const correctCountry = getRandomCountry(section);
    setCurrentQuestion(correctCountry);
    
    // Doğru cevap dışında 3 tane daha rastgele ülke seç
    const otherCountries = getRandomCountries(section, 3, correctCountry);
    
    // 4 seçeneği karıştır
    const allOptions = [correctCountry, ...otherCountries];
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    
    // Doğru cevabın yeni index'ini bul
    const correctIndex = shuffledOptions.findIndex(country => country.code === correctCountry.code);
    
    setFlagOptions(shuffledOptions);
    setCorrectAnswerIndex(correctIndex);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setCheckState('unchecked');
    
    // Zoom animasyonunu section'a göre yap
    const zoomConfigs = {
      header2: { center: fromLonLat([35, 52]), zoom: 4.5 }, // Avrupa
      header1: { center: fromLonLat([-85, 38]), zoom: 2.8 }, // Amerika
      header: { center: fromLonLat([80, 27]), zoom: 4.3 } // Asya
    };
    
    if (mapInstanceRef.current && zoomConfigs[section]) {
      mapInstanceRef.current.getView().animate({
        ...zoomConfigs[section],
        duration: 1000
      });
    }

    // Haritada sorduğu ülkeyi vurgula (harita yüklendikten sonra)
    setTimeout(() => {
      highlightCountryOnMap(correctCountry.name);
    }, 600); // GeoJSON yüklenmesi için bekle
  };

  const handleAnswerSelect = (flagIndex) => {
    setSelectedAnswer(flagIndex);
    setCheckState('checked');
  };

  const handleCheckClick = () => {
    if (selectedAnswer !== null) {
      setIsAnswerChecked(true);
      // Doğru/yanlış kontrolü
      if (selectedAnswer === correctAnswerIndex) {
        setCheckState('correct');
        // Doğru cevaplanan ülkeyi listeye ekle
        if (currentQuestion && !correctlyAnsweredCountries.includes(currentQuestion.name)) {
          setCorrectlyAnsweredCountries(prev => [...prev, currentQuestion.name]);
          // Haritada rengi güncelle
          setTimeout(() => {
            highlightCountryOnMap(currentQuestion.name);
          }, 100);
        }
        // Doğru ses çal
        const correctAudio = new Audio('/sfx/true.mp3');
        correctAudio.volume = 0.5;
        correctAudio.play().catch(error => console.log('Audio play failed:', error));
      } else {
        setCheckState('incorrect');
        // Yanlış ses çal
        const wrongAudio = new Audio('/sfx/false.mp3');
        wrongAudio.volume = 0.5;
        wrongAudio.play().catch(error => console.log('Audio play failed:', error));
      }
    }
  };

  const handleContinueClick = () => {
    // Yeni soru için durumları sıfırla
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setCheckState('initial');
    
    // Yeni soru oluştur
    startLevel(selectedSection);
  };

  const startGame = () => {
    setGameStarted(true);
    // Haritayı Avrupa'ya zoomla
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat([15, 50]), // Avrupa merkezi
        zoom: 5,
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

  const handleTitleClick = () => {
    setShowWelcomeModal(true);
  };

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // OSM tile layer oluştur (başlangıçta görünür)
    const tileLayer = new TileLayer({
      source: new OSM()
    });
    tileLayerRef.current = tileLayer;

    // GeoJSON vektör katmanı oluştur (başlangıçta custom.geo.json ile)
    const vectorSource = new VectorSource({
      url: '/databases/maps/custom.geo.json',
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

    // OpenLayers harita oluştur - Başlangıçta OSM + custom.geo.json
    const map = new Map({
      target: mapRef.current,
      layers: [
        tileLayer,    // OSM altlık
        vectorLayer   // custom.geo.json
      ],
      view: new View({
        center: fromLonLat([0, 45]),
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
    <div className={`main-page ${isDarkMode ? 'dark-mode' : ''} ${showWelcomeModal ? 'modal-open' : ''}`}>
      <div className="top-bar">
        <div className="title-section">
          <h1 className="app-title" onClick={handleTitleClick}>
            <span className="duolingo-text">duolingo</span>
            <span className="gis-text">GIS</span>
          </h1>
        </div>
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
                      {/* Geri Butonu */}
                      <button className="back-button" onClick={handleHomeClick} title="Geri Dön">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                      </button>
                      
                      {/* Soru Kısımı */}
                      <div className="question-section">
                        <img src="/images/duo/Image & Audio.png" alt="Question" className="question-image" />
                        
                        {/* 4 Bayrak Seçeneği */}
                        <div className="flag-options-game">
                          {flagOptions.map((country, index) => (
                            <div 
                              key={index}
                              className={`flag-option ${selectedAnswer === index ? 'selected' : ''}`} 
                              onClick={() => handleAnswerSelect(index)}
                            >
                              <img 
                                src={getFlagUrl(country.code, country.name)} 
                                alt={country.name}
                                onError={(e) => {
                                  console.log(`Flag not found for ${country.name} (${country.code})`);
                                  e.target.src = '/images/duo/level_path/Story.png'; // Fallback image
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Check/Continue Button */}
                        <button 
                          className="check-button" 
                          onClick={checkState === 'correct' ? handleContinueClick : handleCheckClick} 
                          disabled={selectedAnswer === null && checkState !== 'correct'}
                        >
                          <img 
                            src={
                              checkState === 'correct' 
                                ? '/images/duo/continue.png' 
                                : selectedAnswer !== null 
                                  ? '/images/duo/check-2.png' 
                                  : '/images/duo/check-1.png'
                            } 
                            alt={checkState === 'correct' ? 'Continue' : 'Check'} 
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

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="welcome-modal-overlay" onClick={closeWelcomeModal}>
          <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeWelcomeModal}>×</button>
            
            {/* Developer Section */}
            <div className="developer-section">
              <img src="/images/players/kaan.svg" alt="Kaan Kılıçarslan" className="developer-image" />
              <div className="developer-info">
                <h3 className="developer-name">Kaan Kılıçarslan</h3>
                <p className="developer-username">@kaanklcrsln</p>
                <p className="developer-title">Geomatics Engineer</p>
              </div>
              {/* Duo Character */}
              <div className="duo-character">
                <img src="/images/duo/duo-lover.svg" alt="Duo" className="duo-image" />
              </div>
            </div>

            {/* Welcome Content */}
            <div className="welcome-content">
              <h2 className="welcome-title">Welcome to my project geolover!</h2>
              <p className="welcome-description">
                You can play flag quiz games for each continent by selecting sections and choosing levels. 
                Test your geography knowledge and learn about countries and their flags!
              </p>

            </div>


          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
