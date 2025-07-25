
import React, { useState, ChangeEvent, FormEvent } from 'react';

import './MassMailingForm.css';
import { useLanguage } from "../../context/LanguageContext";

interface MailingResult {
  total_users: number;
  success_count: number;
  failed_count: number;
}

interface ApiResponse {
  status: string;
  data?: MailingResult;
  message?: string;
}
type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];
const MassMailingForm: React.FC = () => {
  const { translations, language } = useLanguage();
  const t = translations.mailingTranslations;
  const [message, setMessage] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MailingResult | null>(null);
  const [error, setError] = useState<string>('');
  
  const [scheduledTime, setScheduledTime] = useState<Value>(null);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('message', message);
      if (image) {
        formData.append('image', image);
      }
      if (isScheduled && scheduledTime instanceof Date) {
        formData.append('scheduled_time', scheduledTime.toISOString());
      }

      const response = await fetch('https://api.mamostore.ru/api/mailing/send/', {
        method: 'POST',
        body: formData,
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Произошла ошибка при отправке рассылки');
      }

      if (data.data) {
        setResult(data.data);
      } else {
        setResult(null);
      }
      
      setMessage('');
      setImage(null);
      setPreview('');
      setScheduledTime(null);
      setIsScheduled(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mailing-form">
      <h2>{t.title[language]}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            {t.messageLabel[language]}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder={t.messagePlaceholder[language]}
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {t.imageLabel[language]}
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
              id="image-upload"
            />
            <button
              type="button"
              className="image-upload-button"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              {t.uploadImage[language]}
            </button>
            {preview && (
              <div className="image-preview-container">
                <img
                  src={preview}
                  alt="Preview"
                  className="image-preview"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setPreview('');
                  }}
                  className="remove-image-button"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="checkbox-input"
            />
            {t.scheduledSending[language]}
          </label>
          
          {isScheduled && (
            <div className="scheduled-time-picker">
              <input
                type="datetime-local"
                className="form-control"
                value={scheduledTime instanceof Date ? scheduledTime.toISOString().slice(0, 16) : ''}
                onChange={(e) => setScheduledTime(e.target.value ? new Date(e.target.value) : null)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {result && (
          <div className="success-message">
            <p>{isScheduled ? t.success.scheduled[language] : t.success.sent[language]}</p>
            {result.total_users && (
              <>
                <p>{t.success.totalUsers[language]}: {result.total_users}</p>
                <p>{t.success.successCount[language]}: {result.success_count}</p>
                <p>{t.success.errorCount[language]}: {result.failed_count}</p>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !message || (isScheduled && !scheduledTime)}
          className="submit-button"
        >
          {loading 
            ? t.sending[language] 
            : isScheduled 
              ? t.scheduleMailing[language] 
              : t.sendMailing[language]
          }
        </button>
      </form>
    </div>
  );
//   return (
//     <div className="mailing-form">
//       {/* <h2>Массовая рассылка</h2> */}
//       <h2>{t.title[language]}</h2>

//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label className="form-label">
//             {/* Текст сообщения */}
//             {t.messageLabel[language]}

//           </label>
//           <textarea
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             required
//             // placeholder="Введите текст сообщения..."
//             placeholder={t.messagePlaceholder[language]}
//             className="form-textarea"
//           />
//         </div>

//         <div className="form-group">
//           <label className="form-label">
//             {/* Изображение (опционально) */}
//             {t.imageLabel[language]}

//           </label>
//           <div className="flex items-center space-x-4">
//             <input
//               type="file"
//               onChange={handleImageChange}
//               accept="image/*"
//               className="hidden"
//               id="image-upload"
//             />
//             <button
//               type="button"
//               className="image-upload-button"
//               onClick={() => document.getElementById('image-upload')?.click()}
//             >
//               Загрузить изображение
//             </button>
//             {preview && (
//               <div className="image-preview-container">
//                 <img
//                   src={preview}
//                   alt="Preview"
//                   className="image-preview"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setImage(null);
//                     setPreview('');
//                   }}
//                   className="remove-image-button"
//                 >
//                   ×
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="form-group">
//           <label className="checkbox-label">
//             <input
//               type="checkbox"
//               checked={isScheduled}
//               onChange={(e) => setIsScheduled(e.target.checked)}
//               className="checkbox-input"
//             />
//             Отложенная отправка
//           </label>
          
//           {isScheduled && (
//             <div className="scheduled-time-picker">
//               <input
//                 type="datetime-local"
//                 className="form-control"
//                 // value={scheduledTime ? scheduledTime.toISOString().slice(0, 16) : ''}
//                 value={scheduledTime instanceof Date ? scheduledTime.toISOString().slice(0, 16) : ''}
//                 onChange={(e) => setScheduledTime(e.target.value ? new Date(e.target.value) : null)}
//                 min={new Date().toISOString().slice(0, 16)}
//               />
//             </div>
//           )}
//         </div>

//         {error && (
//           <div className="error-message">
//             {error}
//           </div>
//         )}

//         {result && (
//           <div className="success-message">
//             <p>Рассылка успешно {isScheduled ? 'запланирована' : 'отправлена'}!</p>
//             {result.total_users && (
//               <>
//                 <p>Всего пользователей: {result.total_users}</p>
//                 <p>Успешно отправлено: {result.success_count}</p>
//                 <p>Ошибок: {result.failed_count}</p>
//               </>
//             )}
//           </div>
//         )}

//         <button
//           type="submit"
//           disabled={loading || !message || (isScheduled && !scheduledTime)}
//           className="submit-button"
//         >
//           {loading ? 'Отправка...' : isScheduled ? 'Запланировать рассылку' : 'Отправить рассылку'}
//         </button>
//       </form>
//     </div>
//   );
};

export default MassMailingForm;