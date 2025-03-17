// src/pages/Referral/components/ReferralUsers.tsx
import React, { useState } from 'react';
import './ReferralUsers.css';

interface ReferralUser {
  id: number;
  name: string;
  email: string;
  registrationDate: string;
  totalSpent: number;
  ordersCount: number;
  status: 'active' | 'inactive';
  referrerEarnings: number;
  paidAmount: number;
  refLink: string;
}

const ReferralUsers: React.FC = () => {
  // Заглушки данных пользователей
  const initialUsers: ReferralUser[] = [
    {
      id: 1,
      name: 'Анна Смирнова',
      email: 'anna.smirnova@example.com',
      registrationDate: '15.01.2025',
      totalSpent: 12400,
      ordersCount: 5,
      status: 'active',
      referrerEarnings: 620,
      paidAmount: 250,
      refLink: 'https://mamostore.ru/ref/annas2025'
    },
    {
      id: 2,
      name: 'Игорь Петров',
      email: 'i.petrov@example.com',
      registrationDate: '23.01.2025',
      totalSpent: 8700,
      ordersCount: 3,
      status: 'active',
      referrerEarnings: 435,
      paidAmount: 0,
      refLink: 'https://mamostore.ru/ref/ipetrov25'
    },
    {
      id: 3,
      name: 'Екатерина Иванова',
      email: 'e.ivanova@example.com',
      registrationDate: '02.02.2025',
      totalSpent: 5280,
      ordersCount: 2,
      status: 'active',
      referrerEarnings: 264,
      paidAmount: 150,
      refLink: 'https://mamostore.ru/ref/ekaterina_i'
    },
    {
      id: 4,
      name: 'Дмитрий Козлов',
      email: 'd.kozlov@example.com',
      registrationDate: '12.02.2025',
      totalSpent: 15800,
      ordersCount: 7,
      status: 'active',
      referrerEarnings: 790,
      paidAmount: 500,
      refLink: 'https://mamostore.ru/ref/dmitriy_k'
    },
    {
      id: 5,
      name: 'Мария Соколова',
      email: 'm.sokolova@example.com',
      registrationDate: '27.02.2025',
      totalSpent: 3450,
      ordersCount: 1,
      status: 'inactive',
      referrerEarnings: 172.5,
      paidAmount: 0,
      refLink: 'https://mamostore.ru/ref/maria_sok'
    },
    {
      id: 6,
      name: 'Александр Новиков',
      email: 'a.novikov@example.com',
      registrationDate: '05.03.2025',
      totalSpent: 7200,
      ordersCount: 3,
      status: 'active',
      referrerEarnings: 360,
      paidAmount: 180,
      refLink: 'https://mamostore.ru/ref/alex_nov'
    },
    {
      id: 7,
      name: 'Ольга Морозова',
      email: 'o.morozova@example.com',
      registrationDate: '14.03.2025',
      totalSpent: 9350,
      ordersCount: 4,
      status: 'active',
      referrerEarnings: 467.5,
      paidAmount: 0,
      refLink: 'https://mamostore.ru/ref/olga_m'
    }
  ];

  const [users, setUsers] = useState<ReferralUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ReferralUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentComment, setPaymentComment] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || 
      user.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const totalEarnings = users.reduce((sum, user) => sum + user.referrerEarnings, 0);
  const totalPaid = users.reduce((sum, user) => sum + user.paidAmount, 0);
  const totalPending = totalEarnings - totalPaid;

  const handleUserDetails = (user: ReferralUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handlePaymentInitiate = (user: ReferralUser) => {
    setSelectedUser(user);
    setPaymentAmount((user.referrerEarnings - user.paidAmount).toString());
    setPaymentComment('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = () => {
    if (!selectedUser || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > (selectedUser.referrerEarnings - selectedUser.paidAmount)) return;
    
    // Обновляем данные о выплатах
    const updatedUsers = users.map(user => {
      if (user.id === selectedUser.id) {
        return {
          ...user,
          paidAmount: user.paidAmount + amount
        };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    setShowPaymentModal(false);
    
    // В реальном приложении здесь был бы API-запрос для сохранения информации о выплате
    alert(`Выплата ${amount} ₽ для ${selectedUser.name} успешно зарегистрирована!`);
  };

  const handleCopyLink = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  return (
    <div className="referral-users">
      <div className="referral-section-header">
        <h2 className="referral-section-title">Пользователи реферальной программы</h2>
        <div className="users-filters">
          <div className="search-container">
            <input
              type="text"
              className="referral-input search-input"
              placeholder="Поиск по имени или email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="status-filter">
            <button 
              className={`filter-button ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Все
            </button>
            <button 
              className={`filter-button ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Активные
            </button>
            <button 
              className={`filter-button ${filterStatus === 'inactive' ? 'active' : ''}`}
              onClick={() => setFilterStatus('inactive')}
            >
              Неактивные
            </button>
          </div>
        </div>
      </div>

      <div className="users-summary">
        <div className="summary-card referral-card">
          <div className="summary-icon total-icon"></div>
          <div className="summary-content">
            <h3 className="summary-title">Всего пользователей</h3>
            <p className="summary-value">{totalUsers}</p>
          </div>
        </div>
        <div className="summary-card referral-card">
          <div className="summary-icon active-icon"></div>
          <div className="summary-content">
            <h3 className="summary-title">Активных пользователей</h3>
            <p className="summary-value">{activeUsers}</p>
          </div>
        </div>
        <div className="summary-card referral-card">
          <div className="summary-icon earnings-icon"></div>
          <div className="summary-content">
            <h3 className="summary-title">Общий заработок</h3>
            <p className="summary-value">{totalEarnings} ₽</p>
          </div>
        </div>
        <div className="summary-card referral-card">
          <div className="summary-icon pending-icon"></div>
          <div className="summary-content">
            <h3 className="summary-title">К выплате</h3>
            <p className="summary-value">{totalPending} ₽</p>
          </div>
        </div>
      </div>

      <div className="users-table-container referral-card">
        <table className="referral-table users-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Реф. ссылка</th>
              <th>Регистрация</th>
              <th>Заработок</th>
              <th>Выплачено</th>
              <th>К выплате</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={user.status === 'inactive' ? 'inactive-user' : ''}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <div className="link-url">
                    <span className="truncate-url">{user.refLink}</span>
                    <button 
                      className="copy-button"
                      onClick={() => handleCopyLink(user.id, user.refLink)}
                    >
                      {copiedLinkId === user.id ? 'Скопировано!' : 'Копировать'}
                    </button>
                  </div>
                </td>
                <td>{user.registrationDate}</td>
                <td>{user.referrerEarnings} ₽</td>
                <td>{user.paidAmount} ₽</td>
                <td>{user.referrerEarnings - user.paidAmount} ₽</td>
                <td>
                  <span className={`referral-status ${user.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {user.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td>
                  <div className="user-actions">
                    <button 
                      className="user-action-button details-button"
                      onClick={() => handleUserDetails(user)}
                    >
                      Подробнее
                    </button>
                    {(user.referrerEarnings - user.paidAmount) > 0 && (
                      <button 
                        className="user-action-button payment-button"
                        onClick={() => handlePaymentInitiate(user)}
                      >
                        Выплатить
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={9} className="no-data-message">
                  Пользователи не найдены. Попробуйте изменить параметры фильтра.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Модальное окно с подробной информацией о пользователе */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay">
          <div className="user-details-modal referral-card">
            <div className="modal-header">
              <h3 className="modal-title">Информация о пользователе</h3>
              <button className="close-modal-button" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="user-profile">
                <div className="user-avatar">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="user-info">
                  <h4 className="user-name">{selectedUser.name}</h4>
                  <p className="user-email">{selectedUser.email}</p>
                  <p className="user-date">Зарегистрирован: {selectedUser.registrationDate}</p>
                  <span className={`referral-status ${selectedUser.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {selectedUser.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>

              <div className="user-stats">
                <div className="user-stat-card">
                  <div className="stat-value">{selectedUser.ordersCount}</div>
                  <div className="stat-label">Заказов</div>
                </div>
                <div className="user-stat-card">
                  <div className="stat-value">{selectedUser.totalSpent} ₽</div>
                  <div className="stat-label">Сумма покупок</div>
                </div>
                <div className="user-stat-card">
                  <div className="stat-value">{selectedUser.referrerEarnings} ₽</div>
                  <div className="stat-label">Заработок</div>
                </div>
                <div className="user-stat-card">
                  <div className="stat-value">{selectedUser.paidAmount} ₽</div>
                  <div className="stat-label">Выплачено</div>
                </div>
              </div>

              <div className="referral-link-section">
                <h4 className="section-subtitle">Реферальная ссылка</h4>
                <div className="link-display">
                  <div className="link-url-value">
                    {selectedUser.refLink}
                    <button 
                      className="copy-button"
                      onClick={() => navigator.clipboard.writeText(selectedUser.refLink)}
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              </div>

              <div className="user-orders-section">
                <h4 className="section-subtitle">История заказов</h4>
                <table className="referral-table orders-table">
                  <thead>
                    <tr>
                      <th>№ заказа</th>
                      <th>Дата</th>
                      <th>Сумма</th>
                      <th>Комиссия</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Заглушки данных заказов */}
                    {Array.from({ length: selectedUser.ordersCount }).map((_, index) => {
                      const orderDate = new Date(selectedUser.registrationDate.split('.').reverse().join('-'));
                      orderDate.setDate(orderDate.getDate() + index * 5 + 2);
                      const orderDateString = orderDate.toLocaleDateString('ru-RU');
                      
                      const orderAmount = Math.round((selectedUser.totalSpent / selectedUser.ordersCount) * (0.85 + Math.random() * 0.3));
                      const commission = Math.round(orderAmount * 0.05);
                      
                      return (
                        <tr key={index}>
                          <td>ORD-{2025000 + selectedUser.id * 100 + index}</td>
                          <td>{orderDateString}</td>
                          <td>{orderAmount} ₽</td>
                          <td>{commission} ₽</td>
                          <td>
                            <span className="referral-status status-completed">
                              Выполнен
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {selectedUser.ordersCount === 0 && (
                      <tr>
                        <td colSpan={5} className="no-data-message">
                          У этого пользователя пока нет заказов.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="payment-history-section">
                <h4 className="section-subtitle">История выплат</h4>
                {selectedUser.paidAmount > 0 ? (
                  <table className="referral-table payment-table">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Сумма</th>
                        <th>Комментарий</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Заглушка для истории выплат */}
                      <tr>
                        <td>15.02.2025</td>
                        <td>{selectedUser.paidAmount} ₽</td>
                        <td>Выплата за январь-февраль 2025</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data-message">Выплаты еще не производились</p>
                )}
              </div>

              <div className="user-action-buttons">
                {(selectedUser.referrerEarnings - selectedUser.paidAmount) > 0 && (
                  <button 
                    className="referral-button make-payment-button"
                    onClick={() => {
                      setShowUserModal(false);
                      handlePaymentInitiate(selectedUser);
                    }}
                  >
                    Произвести выплату
                  </button>
                )}
                <button 
                  className="referral-button secondary-button close-button"
                  onClick={() => setShowUserModal(false)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для выплаты вознаграждения */}
      {showPaymentModal && selectedUser && (
        <div className="modal-overlay">
          <div className="payment-modal referral-card">
            <div className="modal-header">
              <h3 className="modal-title">Выплата реферального вознаграждения</h3>
              <button className="close-modal-button" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="payment-user-info">
                <p>Получатель: <strong>{selectedUser.name}</strong></p>
                <p>Email: <strong>{selectedUser.email}</strong></p>
                <p>Доступно к выплате: <strong>{selectedUser.referrerEarnings - selectedUser.paidAmount} ₽</strong></p>
              </div>

              <div className="payment-form">
                <div className="form-group">
                  <label className="payment-form-label">
                    Сумма выплаты (₽)
                    <input 
                      type="number"
                      className="referral-input payment-amount-input"
                      placeholder="Введите сумму выплаты"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="1"
                      max={selectedUser.referrerEarnings - selectedUser.paidAmount}
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label className="payment-form-label">
                    Комментарий (опционально)
                    <input 
                      type="text"
                      className="referral-input payment-comment-input"
                      placeholder="Например: Выплата за февраль 2025"
                      value={paymentComment}
                      onChange={(e) => setPaymentComment(e.target.value)}
                    />
                  </label>
                </div>

                <div className="payment-summary">
                  <div className="payment-summary-row">
                    <span className="payment-summary-label">Сумма выплаты:</span>
                    <span className="payment-summary-value">{paymentAmount ? `${paymentAmount} ₽` : '0 ₽'}</span>
                  </div>
                  <div className="payment-summary-row">
                    <span className="payment-summary-label">Комиссия за перевод:</span>
                    <span className="payment-summary-value">0 ₽</span>
                  </div>
                  <div className="payment-summary-row total">
                    <span className="payment-summary-label">Итого:</span>
                    <span className="payment-summary-value">{paymentAmount ? `${paymentAmount} ₽` : '0 ₽'}</span>
                  </div>
                </div>

                <div className="payment-actions">
                  <button 
                    className="referral-button payment-submit-button"
                    onClick={handlePaymentSubmit}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > (selectedUser.referrerEarnings - selectedUser.paidAmount)}
                  >
                    Подтвердить выплату
                  </button>
                  <button 
                    className="referral-button secondary-button cancel-button"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralUsers;