
// import React, { useState } from 'react';
// import './UserImportExport.css';
// import { useLanguage } from "../../context/LanguageContext";

// // Custom icon components
// const UploadIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
//   <svg 
//     className={`admin-icon ${className}`}
//     viewBox="0 0 24 24" 
//     fill="none" 
//     stroke="currentColor" 
//     strokeWidth="2" 
//     strokeLinecap="round" 
//     strokeLinejoin="round"
//   >
//     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//     <polyline points="17 8 12 3 7 8" />
//     <line x1="12" y1="3" x2="12" y2="15" />
//   </svg>
// );

// const DownloadIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
//   <svg 
//     className={`admin-icon ${className}`}
//     viewBox="0 0 24 24" 
//     fill="none" 
//     stroke="currentColor" 
//     strokeWidth="2" 
//     strokeLinecap="round" 
//     strokeLinejoin="round"
//   >
//     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//     <polyline points="7 10 12 15 17 10" />
//     <line x1="12" y1="15" x2="12" y2="3" />
//   </svg>
// );

// const AlertIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
//   <svg 
//     className={`admin-icon ${className}`}
//     viewBox="0 0 24 24" 
//     fill="none" 
//     stroke="currentColor" 
//     strokeWidth="2" 
//     strokeLinecap="round" 
//     strokeLinejoin="round"
//   >
//     <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
//     <line x1="12" y1="9" x2="12" y2="13" />
//     <line x1="12" y1="17" x2="12.01" y2="17" />
//   </svg>
// );

// interface ImportResults {
//   processed: number;
//   errors: string[];
// }

// const Button: React.FC<{
//   onClick?: () => void;
//   disabled?: boolean;
//   className?: string;
//   children: React.ReactNode;
// }> = ({ onClick, disabled, className = '', children }) => (
//   <button
//     onClick={onClick}
//     disabled={disabled}
//     className={`admin-button admin-button-primary ${className}`}
//   >
//     {children}
//   </button>
// );

// const UserImportExport: React.FC = () => {
//   const { translations, language } = useLanguage();
//   const t = translations.excelTranslations;
//   const [importing, setImporting] = useState<boolean>(false);
//   const [exportLoading, setExportLoading] = useState<boolean>(false);
//   const [importResults, setImportResults] = useState<ImportResults | null>(null);
//   const [error, setError] = useState<string>('');

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('file', file);

//     setImporting(true);
//     setError('');
//     setImportResults(null);

//     try {
//       const response = await fetch('https://api.mamostore.ru/api/excel/users/import/', {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Import failed');
//       }

//       setImportResults(data);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to import users');
//     } finally {
//       setImporting(false);
//     }
//   };

//   const handleExport = async () => {
//     setExportLoading(true);
//     setError('');

//     try {
//       const response = await fetch('https://api.mamostore.ru/api/excel/users/export/');
      
//       if (!response.ok) {
//         throw new Error('Export failed');
//       }

//       const contentDisposition = response.headers.get('Content-Disposition');
//       const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
//       const filename = filenameMatch ? filenameMatch[1] : 'users_export.xlsx';

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to export users');
//     } finally {
//       setExportLoading(false);
//     }
//   };

//   return (
//     <div className="admin-panel">
//       <div className="admin-grid">
//         {/* Import Section */}
//         <div className="admin-section">
//           {/* <h2 className="admin-title">Import Users</h2> */}
//           <h2 className="admin-title">{t.import.title[language]}</h2>

//           <div className="flex items-center gap-4">
//             <label className="cursor-pointer">
//               <input
//                 type="file"
//                 className="hidden"
//                 accept=".xlsx,.xls"
//                 onChange={handleFileUpload}
//                 disabled={importing}
//               />
//               <Button disabled={importing}>
//                 <UploadIcon />
//                 <span>
                  
//                   {/* {importing ? 'Importing...' : 'Upload Excel'} */}
//                   {importing ? t.import.importing[language] : t.import.button[language]}

//                 </span>
//               </Button>
//             </label>
//           </div>

//           {importResults && (
//             <div className="mt-4 space-y-2">
//               <p className="text-sm text-gray-600">
//                 {/* Processed {importResults.processed} users */}
//                 {t.import.processed[language]} {importResults.processed}

//               </p>
//               {importResults.errors.length > 0 && (
//                 <div className="admin-error">
//                   <div className="admin-error-text">
//                     <AlertIcon />
//                     <div className="flex-1">
//                       <strong className="font-medium">
//                         {/* Errors occurred: */}
//                         {t.import.errorOccurred[language]}
//                         </strong>
//                       <ul className="list-disc pl-4 mt-1 text-sm space-y-1">
//                         {importResults.errors.map((error, index) => (
//                           <li key={index}>{error}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Export Section */}
//         <div className="admin-section">
//           <h2 className="admin-title">
//             {/* Export Users */}
//             {t.export.title[language]}
//             </h2>
//           <Button onClick={handleExport} disabled={exportLoading}>
//             <DownloadIcon />
//             {/* <span>{exportLoading ? 'Exporting...' : 'Export to Excel'}</span> */}
//             <span>{exportLoading ? t.export.exporting[language] : t.export.button[language]}</span>

//           </Button>
//         </div>
//       </div>

//       {error && (
//         <div className="admin-error">
//           <div className="admin-error-text">
//             <AlertIcon />
//             <span>{error}</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserImportExport;


import React, { useState, CSSProperties } from 'react';

// Компоненты иконок
const UploadIcon: React.FC = () => (
  <svg 
    style={{ width: '20px', height: '20px', strokeWidth: 2 }}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg 
    style={{ width: '20px', height: '20px', strokeWidth: 2 }}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const AlertIcon: React.FC = () => (
  <svg 
    style={{ width: '20px', height: '20px', strokeWidth: 2 }}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg 
    style={{ width: '20px', height: '20px', strokeWidth: 2 }}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const FileIcon: React.FC = () => (
  <svg 
    style={{ width: '20px', height: '20px', strokeWidth: 2 }}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg 
    style={{ width: '20px', height: '20px', strokeWidth: 2 }}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Стили с правильными типами
const colors = {
  primary: '#3977F1',
  primaryLight: '#D4E0FA',
  primaryHover: '#2d5fc0',
  danger: '#D93325',
  dangerHover: '#b12a1f',
  success: '#22c55e',
  successHover: '#16a34a',
  neutral50: '#f8f8f8',
  neutral100: '#f1f1f1',
  neutral200: '#e5e5e5',
  neutral300: '#d4d4d4',
  neutral400: '#a3a3a3',
  neutral500: '#7D7D7D',
  neutral600: '#525252',
  neutral700: '#404040',
  neutral800: '#262626',
  neutral900: '#131313',
};

// Создадим объекты стилей, соответствующие типу CSSProperties
const dashboardStyle: CSSProperties = {
  margin: '20px',
  fontFamily: "'Rubik', sans-serif",
};

const containerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '24px',
};

const baseCardStyle: CSSProperties = {
  background: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  position: 'relative',
  border: '1px solid #e5e5e5',
};

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid #e5e5e5',
};

const cardTitleStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 500,
  color: '#131313',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const cardBodyStyle: CSSProperties = {
  padding: '20px',
};

const buttonContainerStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
};

const baseButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px 16px',
  backgroundColor: colors.primary,
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.3s',
  position: 'relative',
  overflow: 'hidden',
};

const buttonDisabledStyle: CSSProperties = {
  backgroundColor: colors.neutral300,
  cursor: 'not-allowed',
};

const fileInputStyle: CSSProperties = {
  display: 'none',
};

const fileLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  backgroundColor: 'white',
  color: colors.primary,
  border: `1px solid ${colors.primary}`,
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.3s',
};

const resultsStyle: CSSProperties = {
  marginTop: '20px',
  padding: '16px',
  backgroundColor: colors.neutral50,
  borderRadius: '6px',
};

const resultsStatsStyle: CSSProperties = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
  marginBottom: '12px',
};

const statStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const statLabelStyle: CSSProperties = {
  fontSize: '14px',
  color: colors.neutral600,
};

const statValueStyle: CSSProperties = {
  fontSize: '16px',
  fontWeight: 500,
  color: colors.neutral900,
};

const errorStyle: CSSProperties = {
  marginTop: '16px',
  padding: '12px 16px',
  backgroundColor: '#fee2e2',
  borderLeft: `4px solid ${colors.danger}`,
  borderRadius: '0 6px 6px 0',
  color: colors.danger,
};

const errorListStyle: CSSProperties = {
  marginTop: '8px',
  paddingLeft: '24px',
  fontSize: '14px',
};

const successStyle: CSSProperties = {
  marginTop: '16px',
  padding: '12px 16px',
  backgroundColor: '#dcfce7',
  borderLeft: `4px solid ${colors.success}`,
  borderRadius: '0 6px 6px 0',
  color: colors.successHover,
};

const loadingStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
};

const spinnerStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTopColor: 'white',
  animation: 'spin 0.8s linear infinite',
};

const spinnerDarkStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  border: `2px solid rgba(57, 119, 241, 0.15)`,
  borderTopColor: colors.primary,
  animation: 'spin 0.8s linear infinite',
};

const flexRowCenterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

// Анимация для спиннера
const spinKeyframes = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

// Добавление стилей анимации
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = spinKeyframes;
  document.head.appendChild(styleSheet);
}

interface ImportResults {
  processed: number;
  success_count?: number;
  failed_count?: number;
  errors: string[];
}

const UserImportExport: React.FC = () => {
  const [importing, setImporting] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [hoverState, setHoverState] = useState<{ [key: string]: boolean }>({});

  const handleHover = (id: string, isHovering: boolean) => {
    setHoverState(prev => ({ ...prev, [id]: isHovering }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    setError('');
    setImportResults(null);
    setShowSuccess(false);

    try {
      const response = await fetch('https://api.mamostore.ru/api/excel/users/import/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка импорта');
      }

      setImportResults(data);
      if (data.errors.length === 0) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось импортировать пользователей');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.mamostore.ru/api/excel/users/export/');
      
      if (!response.ok) {
        throw new Error('Ошибка экспорта');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'users_export.xlsx';

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось экспортировать пользователей');
    } finally {
      setExportLoading(false);
    }
  };

  // Создаем динамические стили с учетом состояния компонента
  const importCardStyle: CSSProperties = {
    ...baseCardStyle,
    transform: hoverState['importCard'] ? 'translateY(-3px)' : undefined,
    boxShadow: hoverState['importCard'] 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
      : baseCardStyle.boxShadow,
  };

  const exportCardStyle: CSSProperties = {
    ...baseCardStyle,
    transform: hoverState['exportCard'] ? 'translateY(-3px)' : undefined,
    boxShadow: hoverState['exportCard'] 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
      : baseCardStyle.boxShadow,
  };

  const hoverFileLabelStyle: CSSProperties = {
    ...fileLabelStyle,
    backgroundColor: hoverState['fileLabel'] ? colors.primaryLight : 'white',
  };

  const exportButtonStyle: CSSProperties = {
    ...baseButtonStyle,
    ...(exportLoading ? buttonDisabledStyle : {}),
    backgroundColor: hoverState['exportButton'] && !exportLoading 
      ? colors.primaryHover 
      : colors.primary,
    transform: hoverState['exportButtonActive'] ? 'translateY(1px)' : undefined,
  };

  return (
    <div style={dashboardStyle}>
      <div style={containerStyle}>
        {/* Секция импорта */}
        <div 
          style={importCardStyle}
          onMouseEnter={() => handleHover('importCard', true)}
          onMouseLeave={() => handleHover('importCard', false)}
        >
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>
              <UserIcon /> Импорт пользователей
            </h2>
          </div>
          <div style={cardBodyStyle}>
            <div style={buttonContainerStyle}>
              <label 
                style={hoverFileLabelStyle}
                onMouseEnter={() => handleHover('fileLabel', true)}
                onMouseLeave={() => handleHover('fileLabel', false)}
                title="Формат .xlsx или .xls"
              >
                <UploadIcon />
                <span>{importing ? 'Загрузка...' : 'Выбрать файл'}</span>
                <input
                  type="file"
                  style={fileInputStyle}
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
              </label>
              {fileName && !importing && (
                <div style={statStyle}>
                  <FileIcon />
                  <span style={statValueStyle}>{fileName}</span>
                </div>
              )}
              {importing && (
                <div style={loadingStyle}>
                  <div style={spinnerDarkStyle}></div>
                  <span>Загрузка и обработка файла...</span>
                </div>
              )}
            </div>

            {importResults && (
              <div style={resultsStyle}>
                <div style={resultsStatsStyle}>
                  <div style={statStyle}>
                    <span style={statLabelStyle}>Обработано пользователей:</span>
                    <span style={statValueStyle}>{importResults.processed}</span>
                  </div>
                  {importResults.success_count !== undefined && (
                    <div style={statStyle}>
                      <span style={statLabelStyle}>Успешно:</span>
                      <span style={statValueStyle}>{importResults.success_count}</span>
                    </div>
                  )}
                  {importResults.failed_count !== undefined && (
                    <div style={statStyle}>
                      <span style={statLabelStyle}>Не удалось:</span>
                      <span style={statValueStyle}>{importResults.failed_count}</span>
                    </div>
                  )}
                </div>
                
                {importResults.errors.length > 0 && (
                  <div style={errorStyle}>
                    <div style={flexRowCenterStyle}>
                      <AlertIcon />
                      <strong>Обнаружены ошибки:</strong>
                    </div>
                    <ul style={errorListStyle}>
                      {importResults.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {showSuccess && importResults.errors.length === 0 && (
                  <div style={successStyle}>
                    <div style={flexRowCenterStyle}>
                      <CheckIcon />
                      <strong>Импорт успешно завершен!</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Секция экспорта */}
        <div 
          style={exportCardStyle}
          onMouseEnter={() => handleHover('exportCard', true)}
          onMouseLeave={() => handleHover('exportCard', false)}
        >
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>
              <FileIcon /> Экспорт пользователей
            </h2>
          </div>
          <div style={cardBodyStyle}>
            <div style={buttonContainerStyle}>
              <button 
                style={exportButtonStyle}
                onClick={handleExport} 
                disabled={exportLoading}
                onMouseEnter={() => handleHover('exportButton', true)}
                onMouseLeave={() => handleHover('exportButton', false)}
                onMouseDown={() => handleHover('exportButtonActive', true)}
                onMouseUp={() => handleHover('exportButtonActive', false)}
                title="Скачать таблицу Excel со всеми пользователями"
              >
                {exportLoading ? (
                  <div style={loadingStyle}>
                    <div style={spinnerStyle}></div>
                    <span>Экспорт...</span>
                  </div>
                ) : (
                  <>
                    <DownloadIcon />
                    <span>Экспортировать в Excel</span>
                  </>
                )}
              </button>
            </div>
            
            {showSuccess && !exportLoading && (
              <div style={successStyle}>
                <div style={flexRowCenterStyle}>
                  <CheckIcon />
                  <strong>Экспорт успешно завершен!</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...errorStyle, marginTop: '20px' }}>
          <div style={flexRowCenterStyle}>
            <AlertIcon />
            <strong>{error}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserImportExport;