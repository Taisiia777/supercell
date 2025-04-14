import React, { useState } from 'react';
import './ReferralUsers.css';
import { davDamerAPI } from '../../../store/api/DavdamerAPI';

// Интерфейсы для типизации данных
interface ReferralUser {
  id: number;
  name: string;
  email: string;
  registration_date: string;
  total_spent: number;
  orders_count: number;
  status: 'active' | 'inactive';
  referrer_earnings: number;
  paid_amount: number;
  ref_link: string;
}


interface ReferralSummary {
  total_users: number;
  active_users: number;
  total_earnings: number;
  total_pending: number;
}
interface SocialMedia {
  tiktok: string | null;
  instagram: string | null;
  youtube: string | null;
  vk: string | null;
  telegram: string | null;
}

interface BankDetails {
  bank: string | null;
  phone: string | null;
}

interface PaymentHistory {
  date: string;
  amount: number;
  comment: string;
  bank?: string; // новое поле
  phone?: string; // новое поле
}

interface ReferralUserDetails extends ReferralUser {
  orders: OrderHistory[];
  payments: PaymentHistory[];
  referrals: ReferralUser[];
  social_media?: SocialMedia; // новые данные
  bank_details?: BankDetails; // новые данные
}
interface OrderHistory {
  order_number: string;
  date: string;
  amount: number;
  commission: number;
  status: string;
}

const ReferralUsers: React.FC = () => {
  // Используем хуки RTK Query для получения данных
  const { data, isLoading } = davDamerAPI.useFetchReferralUsersQuery();
  const [makeReferralPayment] = davDamerAPI.useMakeReferralPaymentMutation();
  
  // Хук для получения детальной информации о выбранном пользователе
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { data: userDetails, isLoading: detailsLoading }: 
  { data?: ReferralUserDetails, isLoading: boolean } = 
  davDamerAPI.useFetchReferralUserDetailsQuery(selectedUserId || 0, { 
    skip: !selectedUserId 
  });
  
  
  // Данные от API
  const users: ReferralUser[] = data?.users || [];
  const summary: ReferralSummary = data?.summary || {
    total_users: 0,
    active_users: 0,
    total_earnings: 0,
    total_pending: 0
  };

  // Состояния компонента
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ReferralUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentComment, setPaymentComment] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
  const [paymentBank, setPaymentBank] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');


  const filteredUsers = (users || []).filter(user => {
    // Сначала проверяем, что сам элемент user существует
    if (!user) return false;
    
    const matchesSearch = 
      ((user.name || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
      ((user.email || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (user.status === filterStatus);
    
    return matchesSearch && matchesStatus;
  });
  // Обработчики действий
  const handleUserDetails = (user: ReferralUser) => {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setShowUserModal(true);
  };
  
const handlePaymentInitiate = (user: ReferralUser) => {
  setSelectedUser(user);
  setPaymentAmount((user.referrer_earnings - user.paid_amount).toString());
  
  // Предзаполняем данные только если userDetails доступен
  if (userDetails && userDetails.payments && userDetails.payments.length > 0) {
    setPaymentBank(userDetails.payments[0].bank || '');
    setPaymentPhone(userDetails.payments[0].phone || '');
  } else {
    setPaymentBank('');
    setPaymentPhone('');
  }
  
  setPaymentComment('');
  setShowPaymentModal(true);
};

  const handlePaymentSubmit = async () => {
    if (!selectedUser || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > (selectedUser.referrer_earnings - selectedUser.paid_amount)) return;
    
    try {
      await makeReferralPayment({
        userId: selectedUser.id,
        amount,
        bank: paymentBank || undefined,
        phone: paymentPhone || undefined,
        comment: paymentComment || undefined
      }).unwrap();
      
      setShowPaymentModal(false);
      alert(`Выплата ${amount} ₽ для ${selectedUser.name} успешно зарегистрирована!`);
    } catch (err) {
      const error = err as Error;
      console.error('Ошибка при выполнении выплаты:', error);
      alert('Произошла ошибка при выполнении выплаты');
    }
  };

  const handleCopyLink = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUserId(null);
    setSelectedUser(null);
  };

  if (isLoading) {
    return <div className="loading">Загрузка пользователей...</div>;
  }

  // const handleReferralClick = (referralUser: ReferralUser) => {
  //   // Закрываем текущее модальное окно
  //   setShowUserModal(false);
    
  //   // Небольшая задержка перед открытием нового модального окна
  //   setTimeout(() => {
  //     // Открываем данные по выбранному рефералу
  //     setSelectedUser(referralUser);
  //     setSelectedUserId(referralUser.id);
  //     setShowUserModal(true);
  //   }, 100);
  // };
  const handleReferralClick = (referralUser: ReferralUser) => {
    // Проверяем, есть ли все необходимые поля
    const completeUser: ReferralUser = {
      ...referralUser,
      // Устанавливаем значения по умолчанию для отсутствующих полей
      orders_count: referralUser.orders_count || 0,
      referrer_earnings: referralUser.referrer_earnings || 0,
      paid_amount: referralUser.paid_amount || 0,
      ref_link: referralUser.ref_link || `https://t.me/Mamoshop_bot?start=${referralUser.id}`
    };
    
    setShowUserModal(false);
    
    setTimeout(() => {
      setSelectedUser(completeUser);
      setSelectedUserId(completeUser.id);
      setShowUserModal(true);
    }, 100);
  };
  const displayUser = selectedUser && userDetails ? {
    ...selectedUser,
    ...(userDetails || {}),
    name: userDetails?.name || selectedUser.name,
    email: userDetails?.email || selectedUser.email,
    registration_date: userDetails?.registration_date || selectedUser.registration_date,
    total_spent: userDetails?.total_spent ?? selectedUser.total_spent,
    referrer_earnings: userDetails?.referrer_earnings ?? selectedUser.referrer_earnings,
    paid_amount: userDetails?.paid_amount ?? selectedUser.paid_amount,
    ref_link: userDetails?.ref_link || selectedUser.ref_link,
    status: userDetails?.status || selectedUser.status
  } : selectedUser;
  return (
    <div className="referral-users">
      <div className="referral-section-header">
        <h2 className="referral-section-title">Пользователи реферальной программы</h2>
        <div className="users-filters">
          <div className="search-container">
            <input
              type="text"
              className="referral-input search-input"
              placeholder="Поиск по имени или username"
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
            <p className="summary-value">{summary.total_users}</p>
          </div>
        </div>
      </div>

      <div className="users-table-container referral-card">
        <table className="referral-table users-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Username</th>
              <th>Реф. ссылка</th>
              {/* <th>Регистрация</th>
              <th>Заработок</th>
              <th>Выплачено</th>
              <th>К выплате</th>
              <th>Статус</th> */}
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={user.status === 'inactive' ? 'inactive-user' : ''}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <div className="link-url">
                    <span className="truncate-url">{user.ref_link}</span>
                    <button 
                      className="copy-button"
                      onClick={() => handleCopyLink(user.id, user.ref_link)}
                    >
                      {copiedLinkId === user.id ? 'Скопировано!' : 'Копировать'}
                    </button>
                  </div>
                </td>
                {/* <td>{user.registration_date}</td>
                <td>{Number(user.referrer_earnings).toLocaleString()} ₽</td>
                <td>{Number(user.paid_amount).toLocaleString()} ₽</td>
                <td>{Number(user.referrer_earnings - user.paid_amount).toLocaleString()} ₽</td>
                <td>
                  <span className={`referral-status ${user.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {user.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </td> */}
                <td>
                  <div className="user-actions">
                    <button 
                      className="user-action-button details-button"
                      onClick={() => handleUserDetails(user)}
                    >
                      Подробнее
                    </button>
                    {(user.referrer_earnings - user.paid_amount) > 0 && (
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
      {showUserModal && displayUser && (
        <div className="modal-overlay">
          <div className="user-details-modal referral-card">
            <div className="modal-header">
              <h3 className="modal-title">Информация о пользователе</h3>
              <button className="close-modal-button" onClick={closeUserModal}>×</button>
            </div>
            
            <div className="modal-content">
              {detailsLoading ? (
                <div className="loading-details">Загрузка подробной информации...</div>
              ) : (
                <>
                  <div className="user-profile">
                    <div className="user-avatar">
                      {displayUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="user-info">
                      <h4 className="user-name">{displayUser.name}</h4>
                      <p className="user-email">{displayUser.email}</p>
                      <p className="user-date">Зарегистрирован: {displayUser.registration_date}</p>
                      <span className={`referral-status ${displayUser.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                        {displayUser.status === 'active' ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                  </div>

                  <div className="user-stats">
                    <div className="user-stat-card">
                      <div className="stat-value">{displayUser.orders_count}</div>

                      <div className="stat-label">Заказов</div>
                    </div>
                    <div className="user-stat-card">
                      <div className="stat-value">{Number(displayUser.total_spent).toLocaleString()} ₽</div>
                      <div className="stat-label">Сумма покупок</div>
                    </div>
                    <div className="user-stat-card">
                      <div className="stat-value">{Number(displayUser.referrer_earnings).toLocaleString()} ₽</div>
                      <div className="stat-label">Заработок</div>
                    </div>
                    <div className="user-stat-card">
                      <div className="stat-value">{Number(displayUser.paid_amount).toLocaleString()} ₽</div>
                      <div className="stat-label">Выплачено</div>
                    </div>
                  </div>

                  <div className="referral-link-section">
                    <h4 className="section-subtitle">Реферальная ссылка</h4>
                    <div className="link-display">
                      <div className="link-url-value">
                      {userDetails?.ref_link || "Ссылка загружается..."}
                      <button 
                          className="copy-button"
                          onClick={() => navigator.clipboard.writeText(displayUser.ref_link)}
                        >
                          Копировать
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Список рефералов пользователя */}
                  <div className="user-referrals-section">
                    <h4 className="section-subtitle">Рефералы пользователя</h4>
                    {userDetails?.referrals && userDetails.referrals.length > 0 ? (
                      <table className="referral-table referrals-table">
                        <thead>
                          <tr>
                            <th>Имя</th>
                            <th>Username</th>
                            <th>Регистрация</th>
                            <th>Сумма покупок</th>
                            <th>Статус</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.referrals.map((referral, index) => (
                            <tr 
                              key={index} 
                              onClick={() => handleReferralClick(referral)} 
                              style={{ cursor: 'pointer' }}
                              className="clickable-row"  // Добавьте этот класс для стилизации
                            >
                              <td>{referral.name}</td>
                              <td>{referral.email}</td>
                              <td>{referral.registration_date}</td>
                              <td>{Number(referral.total_spent).toLocaleString()} ₽</td>
                              <td>
                                <span className={`referral-status ${referral.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                  {referral.status === 'active' ? 'Активен' : 'Неактивен'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-data-message">У пользователя пока нет рефералов</p>
                    )}
                  </div>

                    {userDetails?.social_media && (
                      <div className="user-social-media-section">
                        <h4 className="section-subtitle">Социальные сети</h4>
                        <div className="social-media-grid">
                          {userDetails.social_media.instagram && (
                            <div className="social-media-item">
                              <div className="social-media-icon instagram-icon"></div>
                              <div className="social-media-info">
                                <span className="social-media-label">Instagram</span>
                                <a 
                                  href={`https://instagram.com/${userDetails.social_media.instagram}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="social-media-value"
                                >
                                  {userDetails.social_media.instagram}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {userDetails.social_media.tiktok && (
                            <div className="social-media-item">
                              <div className="social-media-icon tiktok-icon"></div>
                              <div className="social-media-info">
                                <span className="social-media-label">TikTok</span>
                                <a 
                                  href={`https://tiktok.com/@${userDetails.social_media.tiktok}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="social-media-value"
                                >
                                  {userDetails.social_media.tiktok}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {userDetails.social_media.youtube && (
                            <div className="social-media-item">
                              <div className="social-media-icon youtube-icon"></div>
                              <div className="social-media-info">
                                <span className="social-media-label">YouTube</span>
                                <a 
                                  href={`https://youtube.com/${userDetails.social_media.youtube}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="social-media-value"
                                >
                                  {userDetails.social_media.youtube}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {userDetails.social_media.vk && (
                            <div className="social-media-item">
                              <div className="social-media-icon vk-icon"></div>
                              <div className="social-media-info">
                                <span className="social-media-label">ВКонтакте</span>
                                <a 
                                  href={`https://vk.com/${userDetails.social_media.vk}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="social-media-value"
                                >
                                  {userDetails.social_media.vk}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {userDetails.social_media.telegram && (
                            <div className="social-media-item">
                              <div className="social-media-icon telegram-icon"></div>
                              <div className="social-media-info">
                                <span className="social-media-label">Telegram</span>
                                <a 
                                  href={`https://t.me/${userDetails.social_media.telegram}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="social-media-value"
                                >
                                  {userDetails.social_media.telegram}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {!userDetails.social_media.instagram && 
                          !userDetails.social_media.tiktok && 
                          !userDetails.social_media.youtube && 
                          !userDetails.social_media.vk && 
                          !userDetails.social_media.telegram && (
                            <p className="no-data-message">Пользователь не указал социальные сети</p>
                          )}
                        </div>
                      </div>
                    )}
                  {userDetails?.bank_details && (
                    <div className="user-bank-details-section">
                      <h4 className="section-subtitle">Платежная информация</h4>
                      <div className="bank-details-grid">
                        {userDetails.bank_details.bank && (
                          <div className="bank-detail-item">
                            <div className="bank-detail-icon bank-icon"></div>
                            <div className="bank-detail-info">
                              <span className="bank-detail-label">Банк</span>
                              <span className="bank-detail-value">{userDetails.bank_details.bank}</span>
                            </div>
                          </div>
                        )}
                        
                        {userDetails.bank_details.phone && (
                          <div className="bank-detail-item">
                            <div className="bank-detail-icon phone-icon"></div>
                            <div className="bank-detail-info">
                              <span className="bank-detail-label">Телефон для выплаты</span>
                              <span className="bank-detail-value">{userDetails.bank_details.phone}</span>
                            </div>
                          </div>
                        )}
                        
                        {!userDetails.bank_details.bank && !userDetails.bank_details.phone && (
                          <p className="no-data-message">Платежная информация не указана</p>
                        )}
                      </div>
                    </div>
                  )}
                  {/* История заказов */}
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
                        {userDetails?.orders && userDetails.orders.length > 0 ? (
                          userDetails.orders.map((order, index) => (
                            <tr key={index}>
                              <td>{order.order_number}</td>
                              <td>{order.date}</td>
                              <td>{Number(order.amount).toLocaleString()} ₽</td>
                              <td>{Number(order.commission).toLocaleString()} ₽</td>
                              <td>
                                <span className={`referral-status status-${order.status.toLowerCase()}`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="no-data-message">
                              У этого пользователя пока нет заказов.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* История выплат */}
                  <div className="payment-history-section">
                    <h4 className="section-subtitle">История выплат</h4>
                    {userDetails?.payments && userDetails.payments.length > 0 ? (
                      <table className="referral-table payment-table">
                        <thead>
                          <tr>
                            <th>Дата</th>
                            <th>Сумма</th>
                            <th>Банк</th>
                            <th>Телефон</th>
                            <th>Комментарий</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.payments.map((payment, index) => (
                            <tr key={index}>
                              <td>{payment.date}</td>
                              <td>{Number(payment.amount).toLocaleString()} ₽</td>
                              <td>{payment.bank || "—"}</td>
                              <td>{payment.phone || "—"}</td>
                              <td>{payment.comment || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-data-message">Выплаты еще не производились</p>
                    )}
                  </div>

                  <div className="user-action-buttons">
                    {(displayUser.referrer_earnings - displayUser.paid_amount) > 0 && (
                      <button 
                        className="referral-button make-payment-button"
                        onClick={() => {
                          setShowUserModal(false);
                          handlePaymentInitiate(displayUser);
                        }}
                      >
                        Произвести выплату
                      </button>
                    )}
                    <button 
                      className="referral-button secondary-button close-button"
                      onClick={closeUserModal}
                    >
                      Закрыть
                    </button>
                  </div>
                </>
              )}
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
                <p>Username: <strong>{selectedUser.email}</strong></p>
                <p>Доступно к выплате: <strong>{Number(selectedUser.referrer_earnings - selectedUser.paid_amount).toLocaleString()} ₽</strong></p>
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
                        max={selectedUser.referrer_earnings - selectedUser.paid_amount}
                      />
                    </label>
                  </div>
                  
                  <div className="form-group">
                    <label className="payment-form-label">
                      Банк
                      <input 
                        type="text"
                        className="referral-input payment-bank-input"
                        placeholder="Например: Сбербанк"
                        value={paymentBank}
                        onChange={(e) => setPaymentBank(e.target.value)}
                      />
                    </label>
                  </div>
                  
                  <div className="form-group">
                    <label className="payment-form-label">
                      Телефон для выплаты
                      <input 
                        type="text"
                        className="referral-input payment-phone-input"
                        placeholder="Например: +7 (999) 123-45-67"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
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
                      <span className="payment-summary-value">{paymentAmount ? `${Number(paymentAmount).toLocaleString()} ₽` : '0 ₽'}</span>
                    </div>
                    <div className="payment-summary-row">
                      <span className="payment-summary-label">Комиссия за перевод:</span>
                      <span className="payment-summary-value">0 ₽</span>
                    </div>
                    <div className="payment-summary-row total">
                      <span className="payment-summary-label">Итого:</span>
                      <span className="payment-summary-value">{paymentAmount ? `${Number(paymentAmount).toLocaleString()} ₽` : '0 ₽'}</span>
                    </div>
                  </div>
                  <div className="payment-actions">
                    <button 
                      className="referral-button payment-submit-button"
                      onClick={handlePaymentSubmit}
                      disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > (selectedUser.referrer_earnings - selectedUser.paid_amount)}
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