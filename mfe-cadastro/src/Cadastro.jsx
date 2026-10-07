import { useState } from 'react';
import ResidentsView from './views/ResidentsView';
import AccessControlView from './views/AccessControlView';

export default function Cadastro({ section: initialSection = 'residents', showToast }) {
  const [section, setSection] = useState(initialSection);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Cadastro e acesso</h1>
          <p className="page-subtitle">Gerencie moradores e registros da portaria.</p>
        </div>
        <div className="tabs">
          <button className={section === 'residents' ? 'active' : ''} onClick={() => setSection('residents')}>Moradores</button>
          <button className={section === 'access' ? 'active' : ''} onClick={() => setSection('access')}>Controle de acesso</button>
        </div>
      </div>
      {section === 'residents'
        ? <ResidentsView showToast={showToast} />
        : <AccessControlView showToast={showToast} />}
    </section>
  );
}
