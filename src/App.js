import React, { useEffect, useState } from 'react';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

const App = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('dashboard');
  const [tema, setTema] = useState('oscuro'); 
  const [tipoTCP, setTipoTCP] = useState('barra'); 
  const [tipoUDP, setTipoUDP] = useState('linea'); 

  const c = tema === 'oscuro' 
    ? { pri: '#ec4899', sec: '#0ea5e9', bg: '#0b0f1a', side: '#111827', card: '#1f2937', txt: '#f8fafc', brd: '#374151', hover: '#374151' }
    : { pri: '#db2777', sec: '#0284c7', bg: '#f8fafc', side: '#ffffff', card: '#ffffff', txt: '#1e293b', brd: '#e2e8f0', hover: '#f1f5f9' };

  useEffect(() => {
    const fetchData = () => {
      fetch('http://127.0.0.1:5000/api/datos')
        .then(res => res.json())
        .then(data => { setDatos(data); setLoading(false); })
        .catch(err => console.error("Error:", err));
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const tcp = datos.filter(d => d.origen === 'TCP');
  const udp = datos.filter(d => d.origen === 'UDP');

  const catCount = tcp.reduce((a, d) => {
    const p = d.contenido.split('|');
    const cat = p[1]?.trim() || 'Varios';
    return {...a, [cat]: (a[cat] || 0) + 1};
  }, {});

  const dataTCP = {
    labels: Object.keys(catCount).slice(0, 5),
    datasets: [{ label: 'Registros', data: Object.values(catCount).slice(0, 5), backgroundColor: [c.pri, c.sec, '#8b5cf6', '#f59e0b', '#10b981'], borderRadius: 10 }]
  };

  const temps = udp.slice(-10).map(d => parseFloat(d.contenido.match(/Temp:(\d+\.\d+)/)?.[1] || 0));
  const dataUDP = {
    labels: temps.map((_, i) => `T-${10-i}`),
    datasets: [{ label: 'Temp °C', data: temps, borderColor: c.sec, backgroundColor: `${c.sec}22`, fill: true, tension: 0.4, pointRadius: 4 }]
  };

  const renderChart = (tipo, data) => {
    const options = { 
        maintainAspectRatio: false, 
        plugins: { legend: { labels: { color: c.txt, font: { family: 'Inter, sans-serif' } } } },
        scales: tipo !== 'pastel' ? { 
            x: { grid: { display: false }, ticks: { color: c.txt } },
            y: { grid: { color: `${c.brd}44` }, ticks: { color: c.txt } }
        } : {} 
    };
    if (tipo === 'barra') return <Bar data={data} options={options} />;
    if (tipo === 'linea') return <Line data={data} options={options} />;
    return <Doughnut data={data} options={options} />;
  };

  if (loading) return <div style={{...s.loader, background: c.bg, color: c.pri}}>Cargando Interfaz...</div>;

  return (
    <div style={{...s.body, backgroundColor: c.bg, color: c.txt}}>
      <aside style={{...s.sidebar, backgroundColor: c.side, borderRight: `1px solid ${c.brd}`}}>
        <div style={s.logoWrap}>
          <div style={{...s.logo, background: `linear-gradient(135deg, ${c.pri}, ${c.sec})`}}>
            <i className="fas fa-microchip"></i>
          </div>
          <h2 style={s.logoTxt}>CORE</h2>
        </div>
        <nav style={{marginTop: '20px'}}>
          <div style={vista === 'dashboard' ? {...s.navA, color: c.pri, backgroundColor: `${c.pri}11`} : s.navI} onClick={() => setVista('dashboard')}>
            <i className="fas fa-columns" style={{marginRight: '12px'}}></i> Dashboard
          </div>
          <div style={vista === 'config' ? {...s.navA, color: c.pri, backgroundColor: `${c.pri}11`} : s.navI} onClick={() => setVista('config')}>
            <i className="fas fa-sliders-h" style={{marginRight: '12px'}}></i> Apariencia
          </div>
        </nav>
      </aside>

      <main style={s.main}>
        {vista === 'dashboard' ? (
          <>
            <header style={s.header}>
              <div>
                <h1 style={{fontSize: '28px', fontWeight: 800, margin: 0}}>Monitor de Red</h1>
                <p style={{opacity: 0.5, fontSize: '14px'}}>Sincronización de paquetes en tiempo real</p>
              </div>
              <div style={s.status}><div style={s.dot}></div> SISTEMA ACTIVO</div>
            </header>

            <div style={s.chartGrid}>
              <div style={{...s.box, background: c.card, border: `1px solid ${c.brd}`}}>
                <div style={s.boxHeader}>
                    <h4 style={s.boxTitle}>Tráfico TCP</h4>
                    <select value={tipoTCP} onChange={(e) => setTipoTCP(e.target.value)} style={{...s.select, color: c.txt, backgroundColor: c.bg, borderColor: c.brd}}>
                        <option value="barra">Barras</option>
                        <option value="linea">Líneas</option>
                        <option value="pastel">Dona</option>
                    </select>
                </div>
                <div style={{height: '240px'}}>{renderChart(tipoTCP, dataTCP)}</div>
              </div>

              <div style={{...s.box, background: c.card, border: `1px solid ${c.brd}`}}>
                <div style={s.boxHeader}>
                    <h4 style={s.boxTitle}>Sensores UDP</h4>
                    <select value={tipoUDP} onChange={(e) => setTipoUDP(e.target.value)} style={{...s.select, color: c.txt, backgroundColor: c.bg, borderColor: c.brd}}>
                        <option value="linea">Líneas</option>
                        <option value="barra">Barras</option>
                        <option value="pastel">Dona</option>
                    </select>
                </div>
                <div style={{height: '240px'}}>{renderChart(tipoUDP, dataUDP)}</div>
              </div>
            </div>

            <div style={{...s.box, background: c.card, border: `1px solid ${c.brd}`, padding: '0px'}}>
              <div style={{padding: '20px 25px', borderBottom: `1px solid ${c.brd}`}}>
                <h4 style={{...s.boxTitle, margin: 0}}>Logs de Transmisión</h4>
              </div>
              <div style={s.tableWrap}>
                <div style={{...s.tableHead, backgroundColor: tema === 'oscuro' ? '#161d27' : '#f8fafc'}}>
                    <div style={{flex: 0.6}}>PROTOCOLO</div>
                    <div style={{flex: 2.2}}>DATO / CLIENTE (ID)</div>
                    <div style={{flex: 1.5}}>CATEGORÍA / CIUDAD</div>
                    <div style={{flex: 1.5}}>FECHA Y HORA</div>
                </div>
                <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {datos.slice(-15).reverse().map((d, index) => {
                    const p = d.contenido.split('|');
                    const esTCP = d.origen === 'TCP';
                    return (
                        <div key={d.id} style={{...s.row, borderBottom: `1px solid ${c.brd}`, backgroundColor: index % 2 === 0 ? 'transparent' : `${c.hover}44`}}>
                            <div style={{flex: 0.6}}>
                                <span style={{...s.tag, backgroundColor: esTCP ? `${c.pri}22` : `${c.sec}22`, color: esTCP ? c.pri : c.sec, border: `1px solid ${esTCP ? c.pri : c.sec}44`}}>
                                    {d.origen}
                                </span>
                            </div>
                            {/* CORRECCIÓN DE ÍNDICES */}
                            <div style={{flex: 2.2, fontSize: '11px', fontFamily: 'monospace', opacity: 0.8}}>{esTCP ? p[0] : 'NODE_UDP_STREAM'}</div>
                            <div style={{flex: 1.5, fontSize: '13px', fontWeight: 600}}>{esTCP ? p[1] : d.contenido}</div>
                            <div style={{flex: 1.5, fontSize: '12px', color: '#10b981', fontWeight: 'bold'}}>{esTCP ? p[2] : '---'}</div>
                        </div>
                    );
                    })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{...s.box, background: c.card, border: `1px solid ${c.brd}`, maxWidth: '500px'}}>
            <h2 style={{marginTop: 0}}>Apariencia del Sistema</h2>
            <p style={{opacity: 0.6, marginBottom: '30px'}}>Selecciona el modo visual para la interfaz.</p>
            <div style={s.btnGroup}>
                <button onClick={() => setTema('claro')} style={{...s.btn, backgroundColor: tema === 'claro' ? c.pri : 'transparent', color: tema === 'claro' ? '#fff' : c.txt, border: `1px solid ${tema === 'claro' ? c.pri : c.brd}`}}>
                    <i className="fas fa-sun" style={{marginRight: '8px'}}></i> Modo Claro
                </button>
                <button onClick={() => setTema('oscuro')} style={{...s.btn, backgroundColor: tema === 'oscuro' ? c.pri : 'transparent', color: tema === 'oscuro' ? '#fff' : c.txt, border: `1px solid ${tema === 'oscuro' ? c.pri : c.brd}`}}>
                    <i className="fas fa-moon" style={{marginRight: '8px'}}></i> Modo Oscuro
                </button>
            </div>
            <button onClick={() => setVista('dashboard')} style={{...s.btnMain, backgroundColor: c.pri, boxShadow: `0 4px 14px ${c.pri}66`}}>Aplicar configuración</button>
          </div>
        )}
      </main>
    </div>
  );
};

const s = {
  body: { display: 'flex', minHeight: '100vh', transition: 'all 0.4s ease', fontFamily: "'Inter', sans-serif" },
  sidebar: { width: '260px', padding: '40px 24px', display: 'flex', flexDirection: 'column' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
  logo: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '18px' },
  logoTxt: { fontSize: '20px', fontWeight: 900, letterSpacing: '2px', margin: 0 },
  navI: { padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '8px', opacity: 0.6, transition: '0.2s', display: 'flex', alignItems: 'center' },
  navA: { padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '8px', fontWeight: 700, transition: '0.2s', display: 'flex', alignItems: 'center' },
  main: { flex: 1, padding: '40px 60px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  status: { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '6px 14px', borderRadius: '30px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(16,185,129,0.2)' },
  dot: { width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' },
  chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' },
  box: { padding: '25px', borderRadius: '24px', overflow: 'hidden' },
  boxHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  boxTitle: { fontSize: '12px', fontWeight: 700, letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' },
  select: { padding: '6px 10px', borderRadius: '8px', fontSize: '11px', border: '1px solid', outline: 'none', cursor: 'pointer' },
  tableWrap: { width: '100%' },
  tableHead: { display: 'flex', padding: '15px 25px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', opacity: 0.8 },
  row: { display: 'flex', padding: '16px 25px', alignItems: 'center', transition: '0.2s' },
  tag: { padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 800 },
  btnGroup: { display: 'flex', gap: '15px', marginBottom: '30px' },
  btn: { padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', transition: '0.3s', fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnMain: { padding: '14px 28px', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: 700, cursor: 'pointer', transition: '0.3s' },
  loader: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '20px' }
};

export default App;