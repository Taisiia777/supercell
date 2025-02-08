// import React from 'react';
// import styles from './link-modal.module.scss';
// import Image from 'next/image';
// // import defaultInstructionImage from '@/images/link_instruction.png';

// interface LinkInstructionModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const LinkInstructionModal: React.FC<LinkInstructionModalProps> = ({ isOpen, onClose }) => {
//   if (!isOpen) return null;

//   return (
//     <div className={styles.modal_overlay} onClick={onClose}>
//       <div className={styles.modal_container} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
//         <button className={styles.close_button} onClick={onClose}>
//           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//             <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//             <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//         </button>
        
//         <h3 className={styles.modal_title}>
//           Как получить ссылку для добавления в друзья
//         </h3>
        
//         <div className={styles.modal_content}>
//           <div className={styles.instruction_image}>
//             <Image
//             //   src={defaultInstructionImage}
//             src="https://images.wallpaperscraft.com/image/single/cat_face_eyes_29447_1280x720.jpg"
//               alt="Инструкция по получению ссылки"
//               fill
//               sizes="(max-width: 335px) 100vw"
//               style={{objectFit: 'cover'}}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LinkInstructionModal;
import React from 'react'; 
import styles from './link-modal.module.scss';
import Image from 'next/image';
import clashOfClansInstructionImage from '@/images/link_instruction_clash_of_clans.jpg'; 
import brawlStarsInstructionImage from '@/images/link_instruction_brawl_stars.jpg';
import clashRoyaleInstructionImage from '@/images/link_instruction_clash_royale.jpg';
import hayDayInstructionImage from '@/images/link_instruction_hay_day.jpg'
interface LinkInstructionModalProps {  
  isOpen: boolean;
  onClose: () => void;
  game: string;
}

const LinkInstructionModal: React.FC<LinkInstructionModalProps> = ({ isOpen, onClose, game }) => {  
  if (!isOpen) return null;

  let instructionImage;
  switch (game) {
    case 'clash_of_clans':
      instructionImage = clashOfClansInstructionImage;
      break;
    case 'brawl_stars': 
      instructionImage = brawlStarsInstructionImage;
      break;
    case 'clash_royale':
      instructionImage = clashRoyaleInstructionImage;
    case 'hay_day':
      instructionImage = hayDayInstructionImage;
      break;
    default:
      instructionImage = clashOfClansInstructionImage; 
  }

  return (    
    <div className={styles.modal_overlay} onClick={onClose}>      
      <div className={styles.modal_container} onClick={(e: React.MouseEvent) => e.stopPropagation()}>        
        <button className={styles.close_button} onClick={onClose}>          
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">            
            <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>            
            <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>          
          </svg>        
        </button>                
        <h3 className={styles.modal_title}>          
          Как получить ссылку для добавления в друзья:        
        </h3>                
        <div className={styles.modal_content}>          
          <div className={styles.instruction_image}>            
            <Image            
              src={instructionImage}              
              alt="Инструкция по получению ссылки"              
              fill              
              sizes="(max-width: 335px) 100vw"              
              style={{objectFit: 'cover'}}            
            />          
          </div>        
        </div>      
      </div>    
    </div>  
  );
};

export default LinkInstructionModal;