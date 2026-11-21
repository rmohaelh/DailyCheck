
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>DailyCheck</h1>
        <p>Tu información diaria, en un solo lugar.</p>
      </header>

      <main>
        <section className="weather">
          <h2>El tiempo de hoy</h2>
          <p>Madrid</p>
          <h3>22 °C</h3>
          <p>Parcialmente nublado</p>
        </section>

        <section className="information">
          <h2>Información del día</h2>

          <div className="cards">
            <article className="card">
              <h3>Calidad del aire</h3>
              <p>Pendiente de datos</p>
            </article>

            <article className="card">
              <h3>Índice UV</h3>
              <p>Pendiente de datos</p>
            </article>

            <article className="card">
              <h3>Viento</h3>
              <p>Pendiente de datos</p>
            </article>

            <article className="card">
              <h3>Probabilidad de lluvia</h3>
              <p>Pendiente de datos</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
