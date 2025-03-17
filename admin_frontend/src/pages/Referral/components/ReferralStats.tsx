// src/pages/Referral/components/ReferralStats.tsx
import React, { useState } from 'react';
import './ReferralStats.css';

const ReferralStats: React.FC = () => {
  const [period, setPeriod] = useState('month');

  // Заглушки данных для статистики
  const stats = {
    activeReferrals: 148,
    totalEarnings: 32760,
    pendingPayouts: 3540,
    conversionRate: 5.2,
    registeredUsers: 294,
    purchasedUsers: 82,
    recentEarnings: [4200, 3860, 5100, 3240, 4780, 5920, 6120],
    topReferrers: [
      { id: 1, name: 'Алексей К.', earnings: 6540, referrals: 32 },
      { id: 2, name: 'Марина С.', earnings: 5980, referrals: 29 },
      { id: 3, name: 'Дмитрий В.', earnings: 4820, referrals: 23 },
      { id: 4, name: 'Ольга П.', earnings: 3960, referrals: 19 },
      { id: 5, name: 'Николай Д.', earnings: 3480, referrals: 16 }
    ]
  };

  return (
    <div className="referral-stats">
      <div className="referral-stats-header">
        <h2 className="referral-section-title">Статистика реферальной программы</h2>
        <div className="referral-period-selector">
          <button 
            className={`period-button ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Неделя
          </button>
          <button 
            className={`period-button ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Месяц
          </button>
          <button 
            className={`period-button ${period === 'year' ? 'active' : ''}`}
            onClick={() => setPeriod('year')}
          >
            Год
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stats-card referral-card">
          <div className="stats-card-icon users-icon"></div>
          <div className="stats-card-content">
            <h3 className="stats-card-title">Активные рефералы</h3>
            <p className="stats-card-value">{stats.activeReferrals}</p>
            <p className="stats-card-trend positive">+12% к прошлому месяцу</p>
          </div>
        </div>

        <div className="stats-card referral-card">
          <div className="stats-card-icon earnings-icon"></div>
          <div className="stats-card-content">
            <h3 className="stats-card-title">Общий заработок</h3>
            <p className="stats-card-value">{stats.totalEarnings} ₽</p>
            <p className="stats-card-trend positive">+8.5% к прошлому месяцу</p>
          </div>
        </div>

        <div className="stats-card referral-card">
          <div className="stats-card-icon pending-icon"></div>
          <div className="stats-card-content">
            <h3 className="stats-card-title">К выплате рефереалам</h3>
            <p className="stats-card-value">{stats.pendingPayouts} ₽</p>
            <p className="stats-card-trend neutral">Ожидает выплаты</p>
          </div>
        </div>

        <div className="stats-card referral-card">
          <div className="stats-card-icon conversion-icon"></div>
          <div className="stats-card-content">
            <h3 className="stats-card-title">Конверсия</h3>
            <p className="stats-card-value">{stats.conversionRate}%</p>
            <p className="stats-card-trend positive">+0.7% к прошлому месяцу</p>
          </div>
        </div>
      </div>

      <div className="stats-row">

        <div className="stats-top-referrers referral-card">
          <h3 className="stats-section-title">Топ реферреров</h3>
          <table className="referral-table top-referrers-table">
            <thead>
              <tr>
                <th>Участник</th>
                <th>Рефералы</th>
                <th>Заработок</th>
                <th>Выплачено</th>
                <th>К выплате</th>
              </tr>
            </thead>
            <tbody>
              {stats.topReferrers.map(referrer => {
                // Заглушки для выплат
                const paidAmount = Math.round(referrer.earnings * 0.6);
                const pendingAmount = referrer.earnings - paidAmount;
                
                return (
                  <tr key={referrer.id}>
                    <td>{referrer.name}</td>
                    <td>{referrer.referrals}</td>
                    <td>{referrer.earnings} ₽</td>
                    <td>{paidAmount} ₽</td>
                    <td>{pendingAmount} ₽</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default ReferralStats;