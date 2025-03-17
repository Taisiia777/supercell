// src/pages/Referral/ReferralPage.tsx
import React, { useState } from 'react';
import Pages from '../../components/PagesHead/PagesHead';
import './ReferralPage.css';
import ReferralStats from './components/ReferralStats';
import ReferralUsers from './components/ReferralUsers';

const ReferralPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('statistics');

  return (
    <>
      <Pages title="Реферальная система" />
      <div className="referral-container">
        <div className="referral-tabs">
          <button 
            className={`referral-tab ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <i className="referral-icon statistics-icon"></i>
            Статистика
          </button>
          <button 
            className={`referral-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="referral-icon users-icon"></i>
            Пользователи
          </button>
        </div>

        <div className="referral-content">
          {activeTab === 'statistics' && <ReferralStats />}
          {activeTab === 'users' && <ReferralUsers />}
        </div>
      </div>
    </>
  );
};

export default ReferralPage;