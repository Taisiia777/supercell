
import { useState, useEffect } from 'react';
import { useTelegram } from '@/app/useTg';
import { formatDate } from '@/utils/formatDate';
import Link from 'next/link';
import styles from './profile-orders.module.scss';
import { IOrder } from '@/types/orders.interface';

const ProfileOrders = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [orders, setOrders] = useState<IOrder[]>([]);
  const { webApp } = useTelegram();
    
  useEffect(() => {
    if (webApp?.initData) {
      fetch(process.env.API_URL + "customer/orders/", {
        headers: {
          'Authorization': `Bearer ${webApp.initData}`,
        },
        cache: "no-cache"
      })
      .then(response => response.json())
      .then(data => {
        if (data?.orders) {
          setOrders(data.orders);
        }
      })
      .catch(error => console.error('Error:', error));
    }
  }, [webApp?.initData]);

  const activeOrders = orders.filter(order => 
    order.status === "PAID" || 
    order.status === "PROCESSING"
  );

  const completedOrders = orders.filter(order =>
    order.status === "DELIVERED"
  );

  return (
    <div className={styles.profile_orders}>
      <div className={styles.tabs_container}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Актуальные
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Завершённые
          </button>
          <div 
            className={`${styles.tab_slider} ${activeTab === 'completed' ? styles.slide_right : ''}`}
          />
        </div>
      </div>

      <div className={styles.orders_list}>
        {(activeTab === 'active' ? activeOrders : completedOrders).map((order) => (
          // <Link
          //   href={`/order/${order.number}`}
          //   key={order.id}
          //   className={styles.order_item}
          // >
          //   <div className={styles.order_header}>
          //     <span className={styles.order_number}>
          //       ЗАКАЗ № {order.number}
          //     </span>
          //   </div>
          //   <div className={styles.order_details}>
          //     ДАТА: {formatDate(order.date_placed)} СУММА: {order.total_incl_tax} ₽
          //   </div>
          // </Link>
          <Link
            href={`/order/${order.number}`}
            key={order.id}
            className={styles.order_item}
          >
            <div className={styles.content}>
              <div className={styles.order_header}>
                <span className={styles.order_number}>
                  ЗАКАЗ № {order.number}
                </span>
              </div>
              <div className={styles.order_details}>
                дата: {formatDate(order.date_placed)} сумма: {order.total_incl_tax} ₽
              </div>
            </div>
            <div className={styles.route}>
              <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.00244141" width="24" height="24" rx="5" fill="url(#paint0_linear_35_2230)"/>
                <rect x="0.252441" y="0.25" width="23.5" height="23.5" rx="4.75" stroke="url(#paint1_linear_35_2230)" strokeOpacity="0.6" strokeWidth="0.5"/>
                <path d="M19.9615 12.1141C19.9556 11.4893 19.6988 10.892 19.2467 10.4516L14.0492 5.34532C13.8222 5.12414 13.5152 5 13.1951 5C12.875 5 12.568 5.12414 12.341 5.34532C12.2274 5.45571 12.1373 5.58705 12.0758 5.73176C12.0143 5.87646 11.9826 6.03168 11.9826 6.18844C11.9826 6.3452 12.0143 6.50042 12.0758 6.64512C12.1373 6.78983 12.2274 6.92117 12.341 7.03156L16.3269 10.9266H4.21154C3.89022 10.9266 3.58206 11.0517 3.35485 11.2744C3.12764 11.4971 3 11.7991 3 12.1141C3 12.429 3.12764 12.731 3.35485 12.9537C3.58206 13.1764 3.89022 13.3016 4.21154 13.3016H16.3269L12.341 17.2084C12.1128 17.4305 11.984 17.7322 11.9829 18.0474C11.9817 18.3625 12.1084 18.6651 12.3349 18.8887C12.5614 19.1123 12.8693 19.2386 13.1908 19.2397C13.5123 19.2408 13.8211 19.1167 14.0492 18.8947L19.2467 13.7884C19.7018 13.3451 19.9588 12.7429 19.9615 12.1141Z" fill="white"/>
                <defs>
                  <linearGradient id="paint0_linear_35_2230" x1="1.20244" y1="-1.27508e-07" x2="17.9187" y2="32.4172" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2A3B67"/>
                    <stop offset="0.635" stopColor="#4578EE"/>
                    <stop offset="1" stopColor="#2A3B67"/>
                  </linearGradient>
                  <linearGradient id="paint1_linear_35_2230" x1="0.00244141" y1="0" x2="13.6325" y2="28.8921" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white"/>
                    <stop offset="1"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </Link>
        ))}

        {(activeTab === 'active' ? activeOrders : completedOrders).length === 0 && (
          <div className={styles.empty_state}>
            {activeTab === 'active' ? 'Нет актуальных заказов' : 'Нет завершённых заказов'}
          </div>
        )}
      </div>

        <Link href={`https://t.me/Mamosupport`} className={styles.support}>
            <svg width="34" height="30" viewBox="0 0 44 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.975" fillRule="evenodd" clipRule="evenodd" d="M15.1456 0C16.1633 0 17.181 0 18.1987 0C22.0921 0.341725 25.6041 2.01204 28.7347 5.01096C30.8224 7.09878 32.2492 9.77906 33.015 13.0518C33.7262 16.9919 33.1875 20.6173 31.3987 23.9283C29.389 27.2843 26.8248 29.6538 23.7061 31.0369C19.4917 32.8023 15.2413 32.9707 10.9551 31.5418C10.1748 32.0752 9.41654 32.6578 8.68028 33.2898C7.00678 34.3374 5.25078 35.0496 3.41225 35.4263C3.00281 35.4283 2.87311 35.1952 3.02313 34.7271C4.50449 33.0316 5.33261 30.908 5.50749 28.3566C3.19356 26.4025 1.52734 23.7611 0.508844 20.4323C0.273243 19.5358 0.103629 18.6294 0 17.7131C0 16.755 0 15.7968 0 14.8386C0.570309 10.6663 2.16668 7.31268 4.78912 4.77789C7.89606 1.94468 11.3482 0.352053 15.1456 0ZM15.385 2.09761C18.9906 1.83279 22.4028 2.75211 25.6218 4.85558C27.3048 6.04617 28.7515 7.6129 29.9619 9.55578C32.3486 14.1321 32.3087 18.664 29.8422 23.1514C27.6431 26.3865 24.9193 28.5489 21.6708 29.6384C17.9856 30.7816 14.324 30.6651 10.6857 29.2888C10.5066 29.3467 10.337 29.4374 10.1769 29.5608C9.15859 30.5069 8.08104 31.3356 6.94422 32.0468C6.77355 32.1717 6.59396 32.2235 6.40545 32.2022C6.90615 30.7037 7.20547 29.137 7.30341 27.502C6.64023 26.8245 5.96179 26.1642 5.26803 25.5209C3.9791 24.1041 2.97139 22.4079 2.2449 20.4323C1.15928 16.7965 1.43864 13.3522 3.083 10.0996C4.6251 7.3484 6.6106 5.31554 9.03946 4.001C11.0857 2.93413 13.201 2.29966 15.385 2.09761Z" fill="#FDFDFD" />
                <path opacity="0.975" fillRule="evenodd" clipRule="evenodd" d="M43.9999 26.7251C43.9999 26.9582 43.9999 27.1912 43.9999 27.4243C43.7605 30.3635 42.7229 32.7071 40.887 34.4552C40.6952 34.6781 40.5256 34.924 40.3782 35.1932C40.3409 35.6153 40.4407 35.9779 40.6775 36.2809C41.2562 36.9801 41.8348 37.6793 42.4135 38.3785C42.5397 38.6015 42.5297 38.8086 42.3836 39C42.244 39 42.1042 39 41.9646 39C41.1068 38.7379 40.2488 38.4401 39.3904 38.1066C38.7393 37.6971 38.1008 37.2699 37.4748 36.8247C34.0746 38.1961 30.7222 38.0278 27.4176 36.3197C26.3608 35.697 25.383 34.9201 24.4843 33.989C24.1916 33.6483 23.9322 33.2727 23.7061 32.8625C26.6171 31.6288 29.1613 29.6347 31.3387 26.8805C33.1331 24.4509 34.3004 21.5764 34.8408 18.257C34.9103 17.7425 34.9502 17.2246 34.9605 16.7032C37.8854 17.1444 40.3497 18.75 42.3537 21.5199C43.3304 23.0315 43.8791 24.7666 43.9999 26.7251ZM36.3374 19.1892C38.8471 19.9031 40.7129 21.7158 41.9346 24.6275C42.678 27.133 42.3787 29.4119 41.0367 31.4641C40.416 32.2438 39.7775 32.9949 39.121 33.7171C38.9257 34.1937 38.766 34.6858 38.6421 35.1932C38.3757 34.8784 38.0763 34.6453 37.7442 34.494C34.4411 36.1021 31.1585 36.0374 27.8965 34.2998C27.5007 34.1207 27.1415 33.8618 26.819 33.5229C30.2387 31.4927 32.9227 28.3981 34.8707 24.239C35.5196 22.6316 36.0085 20.9483 36.3374 19.1892Z" fill="#FDFDFD" />
            </svg>
            <span>Обратиться в поддержку</span>
    </Link>
    </div>
  );
};

export default ProfileOrders;