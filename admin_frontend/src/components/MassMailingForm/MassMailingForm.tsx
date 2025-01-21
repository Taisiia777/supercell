import React, { useState, ChangeEvent, FormEvent } from 'react';
import './MassMailingForm.css';

interface MailingResult {
  total_users: number;
  success_count: number;
  failed_count: number;
}

interface ApiResponse {
  status: string;
  data: MailingResult;
  message?: string;
}

const MassMailingForm: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MailingResult | null>(null);
  const [error, setError] = useState<string>('');

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

      const response = await fetch('https://api.mamostore.ru/api/mailing/send/', {
        method: 'POST',
        body: formData,
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Произошла ошибка при отправке рассылки');
      }

      setResult(data.data);
      setMessage('');
      setImage(null);
      setPreview('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mailing-form">
      <h2>Массовая рассылка</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            Текст сообщения
          </label>
          <textarea
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            required
            placeholder="Введите текст сообщения..."
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Изображение (опционально)
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
              Загрузить изображение
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

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {result && (
          <div className="success-message">
            <p>Рассылка успешно отправлена!</p>
            <p>Всего пользователей: {result.total_users}</p>
            <p>Успешно отправлено: {result.success_count}</p>
            <p>Ошибок: {result.failed_count}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !message}
          className="submit-button"
        >
          {loading ? 'Отправка...' : 'Отправить рассылку'}
        </button>
      </form>
    </div>
  );
};

export default MassMailingForm;