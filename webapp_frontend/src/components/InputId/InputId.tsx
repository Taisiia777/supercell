// // InputId.tsx
// import { useState } from 'react';
// import toast from 'react-hot-toast';
// import styles from './InputId.module.scss';

// interface InputIdProps {
//   title: string;
//   value: string;
//   name: string;
//   background?: boolean;
// }

// const InputId = ({ title, value, name, background = false }: InputIdProps) => {
//   const handleCopy = () => {
//     if (value) {
//       navigator.clipboard.writeText(value);
//       toast('ID скопирован', {
//         icon: '📋',
//         style: {
//           borderRadius: '10px',
//           background: '#333',
//           color: '#fff',
//         },
//         duration: 2000,
//       });
//     }
//   };

//   return (
//     <div className={styles.container}>
//       <div 
//         className={`${styles.inputWrapper} ${background ? styles.withBackground : ''}`} 
//         onClick={handleCopy}
//       >
//         <input 
//           type="text"
//           value={value || ''}
//           readOnly
//           className={styles.input}
//           placeholder={title}
//         />
//         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.icon}>
//           <path d="M8 4V16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18H18C18.5304 18 19.0391 17.7893 19.4142 17.4142C19.7893 17.0391 20 16.5304 20 16V7.242C20 6.97556 19.9467 6.71181 19.8433 6.46624C19.7399 6.22068 19.5885 5.99824 19.398 5.812L16.083 2.57C15.7094 2.20466 15.2076 2.00007 14.685 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//           <path d="M16 18V20C16 20.5304 15.7893 21.0391 15.4142 21.4142C15.0391 21.7893 14.5304 22 14 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V9C4 8.46957 4.21071 7.96086 4.58579 7.58579C4.96086 7.21071 5.46957 7 6 7H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default InputId;
import { useState } from 'react';
import toast from 'react-hot-toast';
import styles from './InputId.module.scss';

interface InputIdProps {
  title: string;
  value: string;
  name: string;
}

const InputId = ({ title, value, name }: InputIdProps) => {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      toast('ID скопирован', {
        icon: '📋',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
        duration: 2000,
      });
    }
  };

  return (
    <div className={styles.input_container}>
      <div className={styles.title}>
        <div className={styles.title_container}>
          <div className={styles.name}>
            <span>{title}</span>
          </div>
        </div>
        <div className={styles.el}>
          <div className={styles.input_content}>
            <input 
              type="text"
              value={value || ''}
              readOnly
              className={styles.input}
              name={name}
            />
          </div>
          <div className={styles.copy} onClick={handleCopy}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M8 4V16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18H18C18.5304 18 19.0391 17.7893 19.4142 17.4142C19.7893 17.0391 20 16.5304 20 16V7.242C20 6.97556 19.9467 6.71181 19.8433 6.46624C19.7399 6.22068 19.5885 5.99824 19.398 5.812L16.083 2.57C15.7094 2.20466 15.2076 2.00007 14.685 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 18V20C16 20.5304 15.7893 21.0391 15.4142 21.4142C15.0391 21.7893 14.5304 22 14 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V9C4 8.46957 4.21071 7.96086 4.58579 7.58579C4.96086 7.21071 5.46957 7 6 7H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputId;