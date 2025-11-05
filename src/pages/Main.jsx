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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleHomeClick = () => {
    setShowLeaderboard(false);
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
    let highlightFeature = null;
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
      if (highlightFeature) {
        highlightFeature.setStyle(undefined);
        highlightFeature = null;
      }

      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        highlightFeature = feature;
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
          <img src="/assets/images/duo/icon.svg" alt="Light Mode" className="dark-mode-icon" />
        ) : (
          <img src="/assets/images/duo/icon-dark.svg" alt="Dark Mode" className="dark-mode-icon" />
        )}
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
            <div className="placeholder-text">Sol Panel</div>
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
