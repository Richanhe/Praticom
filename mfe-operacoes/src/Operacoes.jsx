import { useState } from 'react';
import ReservationsView from './views/ReservationsView';
import DeliveriesView from './views/DeliveriesView';

export default function Operacoes({ section: initialSection = 'reservations', showToast }) {
  const [section, setSection] = useState(initialSection);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Operações</h1>
          <p className="page-subtitle">Centralize reservas e entregas do condomínio.</p>
        </div>
        <div className="tabs">
          <button className={section === 'reservations' ? 'active' : ''} onClick={() => setSection('reservations')}>Reservas</button>
          <button className={section === 'deliveries' ? 'active' : ''} onClick={() => setSection('deliveries')}>Entregas</button>
        </div>
      </div>
      {section === 'reservations'
        ? <ReservationsView showToast={showToast} />
        : <DeliveriesView showToast={showToast} />}
    </section>
  );
}
