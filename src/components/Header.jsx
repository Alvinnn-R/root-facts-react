import { Leaf } from 'lucide-react';

function Header({ modelStatus }) {
  const isModelReady = modelStatus === 'Model AI Siap';

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Leaf size={22} color="#10b981" strokeWidth={2.5} />
          <span style={{ fontWeight: '700', letterSpacing: '-0.5px' }}>RootFacts</span>
        </div>

        <div className="status-pill">
          <span className={`status-dot ${isModelReady ? 'active' : ''}`}></span>
          <span>{modelStatus}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
