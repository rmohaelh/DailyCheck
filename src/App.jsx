
import { useState, useEffect } from 'react'
import './App.css'

// Traduce los códigos meteorológicos de Open-Meteo
function getWeatherDescription(code) {
  if (code === 0) return 'Despejado'
  if (code === 1) return 'Principalmente despejado'
  if (code === 2) return 'Parcialmente nublado'
  if (code === 3) return 'Nublado'
  if (code === 45 || code === 48) return 'Niebla'
  if (code >= 51 && code <= 57) return 'Llovizna'
  if (code >= 61 && code <= 67) return 'Lluvia'
  if (code >= 71 && code <= 77) return 'Nevada'
  if (code >= 80 && code <= 82) return 'Chubascos'
  if (code === 85 || code === 86) return 'Chubascos de nieve'
  if (code >= 95) return 'Tormenta'
  return 'Tiempo variable'
}

// Decide qué fondo debe tener la sección meteorológica
function getWeatherTheme(weather) {
  if (!weather) return 'sunny'

  const code = weather.weather_code
  const temperature = weather.temperature_2m

  if (
    (code >= 71 && code <= 77) ||
    code === 85 ||
    code === 86
  ) {
    return 'snowy'
  }

  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95
  ) {
    return 'rainy'
  }

  if (code === 3 || code === 45 || code === 48) {
    return 'cloudy'
  }

  if (temperature >= 30) return 'hot'
  if (temperature <= 5) return 'cold'

  return 'sunny'
}

// Valoración de la calidad del aire
function getAirStatus(value) {
  if (value <= 20) return 'Bueno'
  if (value <= 40) return 'Razonable'
  if (value <= 60) return 'Moderado'
  if (value <= 80) return 'Malo'
  return 'Muy malo'
}

// Valoración del índice UV
function getUVStatus(value) {
  if (value <= 2) return 'Bajo'
  if (value <= 5) return 'Moderado'
  if (value <= 7) return 'Alto'
  if (value <= 10) return 'Muy alto'
  return 'Extremo'
}

// Valoración del viento
function getWindStatus(value) {
  if (value < 12) return 'Suave'
  if (value < 29) return 'Moderado'
  if (value < 50) return 'Fuerte'
  return 'Muy fuerte'
}

// Valoración de la probabilidad de lluvia
function getRainStatus(value) {
  if (value < 20) return 'Muy baja'
  if (value < 40) return 'Baja'
  if (value < 60) return 'Moderada'
  if (value < 80) return 'Alta'
  return 'Muy alta'
}

function App() {
  const [weather, setWeather] = useState(null)
  const [daily, setDaily] = useState(null)
  const [airQuality, setAirQuality] = useState(null)

  const [city, setCity] = useState({
    name: 'Madrid',
    country: 'España'
  })

  const [search, setSearch] = useState('')
  const [locations, setLocations] = useState([])
  const [selectedDetail, setSelectedDetail] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Consulta el tiempo y la calidad del aire de unas coordenadas
  async function loadCity(latitude, longitude, name, country) {
    setLoading(true)
    setError('')
    setSelectedDetail(null)

    try {
      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code' +
        '&daily=uv_index_max,precipitation_probability_max&timezone=auto'

      const airUrl =
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
        '&current=european_aqi,pm2_5,pm10&timezone=auto'

      const [weatherResponse, airResponse] = await Promise.all([
        fetch(weatherUrl),
        fetch(airUrl)
      ])

      if (!weatherResponse.ok || !airResponse.ok) {
        throw new Error('No se han podido obtener los datos.')
      }

      const weatherData = await weatherResponse.json()
      const airData = await airResponse.json()

      setWeather(weatherData.current)
      setDaily(weatherData.daily)
      setAirQuality(airData.current)

      setCity({ name, country })
      setLocations([])
    } catch (err) {
      setError('No se han podido cargar los datos. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Carga Madrid al abrir la aplicación
  useEffect(() => {
    loadCity(40.4168, -3.7038, 'Madrid', 'España')
  }, [])

  // Busca ciudades mediante el servicio de geocodificación
  async function handleSearch(event) {
    event.preventDefault()

    if (!search.trim()) return

    setError('')
    setLocations([])

    try {
      const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}` +
        '&count=5&language=es&format=json'

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Error en la búsqueda')
      }

      const data = await response.json()

      if (!data.results || data.results.length === 0) {
        setError('No se ha encontrado esa ubicación.')
        return
      }

      setLocations(data.results)
    } catch (err) {
      setError('No se ha podido realizar la búsqueda.')
    }
  }

  // Abre la ubicación seleccionada
  function selectLocation(location) {
    loadCity(
      location.latitude,
      location.longitude,
      location.name,
      location.country || ''
    )
    setSearch('')
  }

  // Valores y valoraciones
  const airValue = airQuality?.european_aqi
  const uvValue = daily?.uv_index_max?.[0]
  const windValue = weather?.wind_speed_10m
  const rainValue = daily?.precipitation_probability_max?.[0]

  const theme = getWeatherTheme(weather)

  return (
    <div className="app">

      <header className="header">
        <h1>DailyCheck</h1>
        <p>Tu información diaria, en un solo lugar.</p>
      </header>

      <main>

        {/* BUSCADOR DE CIUDADES */}
        <section className="search-section">
          <h2>¿Qué tiempo hace en tu zona?</h2>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Busca una ciudad..."
            />

            <button type="submit" disabled={loading}>
              Buscar
            </button>
          </form>

          {locations.length > 0 && (
            <div className="search-results">
              {locations.map((location) => (
                <button
                  key={`${location.id}-${location.latitude}`}
                  onClick={() => selectLocation(location)}
                  type="button"
                >
                  {location.name}, {location.country}
                </button>
              ))}
            </div>
          )}

          {error && <p className="error-message">{error}</p>}
        </section>

        {/* TIEMPO ACTUAL */}
        <section className={`weather ${theme}`}>
          <h2>El tiempo de hoy</h2>

          <p>{city.name}, {city.country}</p>

          {loading ? (
            <p>Cargando información meteorológica...</p>
          ) : weather ? (
            <>
              <h3>{weather.temperature_2m} °C</h3>

              <h4>{getWeatherDescription(weather.weather_code)}</h4>

              <p>
                Sensación térmica: {weather.apparent_temperature} °C
              </p>

              <p>
                Humedad: {weather.relative_humidity_2m}%
              </p>

              <p>
                Viento: {weather.wind_speed_10m} km/h
              </p>
            </>
          ) : (
            <p>Esperando datos meteorológicos...</p>
          )}
        </section>

        {/* TARJETAS */}
        <section className="information">
          <h2>Información del día</h2>

          <div className="cards">

            {/* CALIDAD DEL AIRE */}
            <article
              className="card air-card"
              onClick={() => setSelectedDetail('air')}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setSelectedDetail('air')
              }}
            >
              <div className="card-top">
                <span className="card-icon">🌿</span>
                <span className="card-tag">CALIDAD AMBIENTAL</span>
              </div>

              <h3>Calidad del aire</h3>

              {airValue !== undefined ? (
                <>
                  <p className="card-value">{airValue}</p>
                  <p className="card-description">Índice europeo</p>
                  <span className="card-status">{getAirStatus(airValue)}</span>
                  <p className="card-extra">
                    PM2.5: {airQuality.pm2_5} µg/m³
                  </p>
                </>
              ) : (
                <p>Cargando datos...</p>
              )}
            </article>

            {/* ÍNDICE UV */}
            <article
              className="card uv-card"
              onClick={() => setSelectedDetail('uv')}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setSelectedDetail('uv')
              }}
            >
              <div className="card-top">
                <span className="card-icon">☀️</span>
                <span className="card-tag">RADIACIÓN SOLAR</span>
              </div>

              <h3>Índice UV</h3>

              {uvValue !== undefined ? (
                <>
                  <p className="card-value">{uvValue}</p>
                  <p className="card-description">Máximo previsto hoy</p>
                  <span className="card-status">{getUVStatus(uvValue)}</span>
                </>
              ) : (
                <p>Cargando datos...</p>
              )}
            </article>

            {/* VIENTO */}
            <article
              className="card wind-card"
              onClick={() => setSelectedDetail('wind')}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setSelectedDetail('wind')
              }}
            >
              <div className="card-top">
                <span className="card-icon">💨</span>
                <span className="card-tag">CONDICIONES DEL VIENTO</span>
              </div>

              <h3>Viento</h3>

              {windValue !== undefined ? (
                <>
                  <p className="card-value">
                    {windValue}
                    <span className="card-unit"> km/h</span>
                  </p>
                  <p className="card-description">Velocidad actual</p>
                  <span className="card-status">{getWindStatus(windValue)}</span>
                </>
              ) : (
                <p>Cargando datos...</p>
              )}
            </article>

            {/* LLUVIA */}
            <article
              className="card rain-card"
              onClick={() => setSelectedDetail('rain')}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setSelectedDetail('rain')
              }}
            >
              <div className="card-top">
                <span className="card-icon">🌧️</span>
                <span className="card-tag">PRECIPITACIÓN</span>
              </div>

              <h3>Probabilidad de lluvia</h3>

              {rainValue !== undefined ? (
                <>
                  <p className="card-value">
                    {rainValue}
                    <span className="card-unit">%</span>
                  </p>
                  <p className="card-description">Máximo previsto hoy</p>
                  <span className="card-status">{getRainStatus(rainValue)}</span>
                </>
              ) : (
                <p>Cargando datos...</p>
              )}
            </article>

          </div>

          {/* INFORMACIÓN AMPLIADA */}
          {selectedDetail && (
            <section className="detail">
              <button
                className="detail-close"
                onClick={() => setSelectedDetail(null)}
              >
                Cerrar ✕
              </button>

              {selectedDetail === 'air' && (
                <>
                  <h2>🌿 Calidad del aire</h2>
                  <p>
                    El índice europeo de calidad del aire (European AQI)
                    permite conocer el nivel de contaminación atmosférica.
                    Cuanto más bajo sea el valor, mejor es la calidad del aire.
                  </p>
                  <p>
                    El valor actual en {city.name} es {airValue}.
                    Su clasificación es: {getAirStatus(airValue)}.
                  </p>
                  <p>
                    PM2.5: {airQuality?.pm2_5} µg/m³.
                    PM10: {airQuality?.pm10} µg/m³.
                  </p>
                  <p>
                    PM2.5 y PM10 representan partículas suspendidas en el
                    aire. Se diferencian principalmente por su tamaño.
                  </p>
                </>
              )}

              {selectedDetail === 'uv' && (
                <>
                  <h2>☀️ Índice ultravioleta</h2>
                  <p>
                    El índice UV indica la intensidad de la radiación
                    ultravioleta procedente del sol.
                  </p>
                  <p>
                    El máximo previsto para hoy en {city.name} es {uvValue}.
                    Su nivel es: {getUVStatus(uvValue)}.
                  </p>
                  <p>
                    Cuanto mayor sea el índice UV, mayor es la necesidad
                    de protegerse de la exposición solar.
                  </p>
                </>
              )}

              {selectedDetail === 'wind' && (
                <>
                  <h2>💨 Viento</h2>
                  <p>
                    El viento es el movimiento del aire en la atmósfera.
                    Su velocidad influye en la sensación térmica y en
                    las condiciones meteorológicas.
                  </p>
                  <p>
                    Actualmente en {city.name} alcanza {windValue} km/h.
                    Se clasifica como viento {getWindStatus(windValue).toLowerCase()}.
                  </p>
                </>
              )}

              {selectedDetail === 'rain' && (
                <>
                  <h2>🌧️ Probabilidad de lluvia</h2>
                  <p>
                    Este porcentaje representa la probabilidad de que
                    se produzca precipitación durante el periodo previsto.
                  </p>
                  <p>
                    El máximo previsto hoy en {city.name} es del {rainValue}%.
                    La valoración es: {getRainStatus(rainValue)}.
                  </p>
                  <p>
                    Una probabilidad alta no significa necesariamente
                    que vaya a llover durante todo el día.
                  </p>
                </>
              )}
            </section>
          )}

        </section>
      </main>
    </div>
  )
}

export default App
