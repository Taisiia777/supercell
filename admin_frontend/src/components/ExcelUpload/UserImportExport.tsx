// import React, { useState } from 'react';

// // Custom icon components
// const UploadIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
//   <svg 
//     className={className}
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
//     className={className}
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
//     className={className}
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
//     className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md 
//     hover:bg-blue-700 transition-colors duration-200 
//     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 
//     ${className}`}
//   >
//     {children}
//   </button>
// );

// const UserImportExport: React.FC = () => {
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
//     <div className="p-6 space-y-6 bg-white rounded-lg shadow-sm">
//       <div className="flex flex-col md:flex-row gap-4 justify-between">
//         {/* Import Section */}
//         <div className="w-full md:w-1/2">
//           <h2 className="text-lg font-semibold mb-4 text-gray-800">Import Users</h2>
//           <div className="flex items-center gap-4">
//             <label className="relative cursor-pointer">
//               <input
//                 type="file"
//                 className="hidden"
//                 accept=".xlsx,.xls"
//                 onChange={handleFileUpload}
//                 disabled={importing}
//               />
//               <Button disabled={importing}>
//                 <UploadIcon className="w-4 h-4" />
//                 <span>{importing ? 'Importing...' : 'Upload Excel'}</span>
//               </Button>
//             </label>
//           </div>

//           {importResults && (
//             <div className="mt-4 space-y-2">
//               <p className="text-sm text-gray-600">
//                 Processed {importResults.processed} users
//               </p>
//               {importResults.errors.length > 0 && (
//                 <div className="bg-red-50 border border-red-200 rounded-md p-4">
//                   <div className="flex items-start gap-2 text-red-700">
//                     <AlertIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
//                     <div className="flex-1">
//                       <strong className="font-medium">Errors occurred:</strong>
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
//         <div className="w-full md:w-1/2">
//           <h2 className="text-lg font-semibold mb-4 text-gray-800">Export Users</h2>
//           <Button onClick={handleExport} disabled={exportLoading}>
//             <DownloadIcon className="w-4 h-4" />
//             <span>{exportLoading ? 'Exporting...' : 'Export to Excel'}</span>
//           </Button>
//         </div>
//       </div>

//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-md p-4">
//           <div className="flex items-center gap-2 text-red-700">
//             <AlertIcon className="w-4 h-4 flex-shrink-0" />
//             <span className="text-sm">{error}</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserImportExport;
import React, { useState } from 'react';
import './UserImportExport.css';

// Custom icon components
const UploadIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    className={`admin-icon ${className}`}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    className={`admin-icon ${className}`}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    className={`admin-icon ${className}`}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

interface ImportResults {
  processed: number;
  errors: string[];
}

const Button: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, className = '', children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`admin-button admin-button-primary ${className}`}
  >
    {children}
  </button>
);

const UserImportExport: React.FC = () => {
  const [importing, setImporting] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    setError('');
    setImportResults(null);

    try {
      const response = await fetch('https://api.mamostore.ru/api/excel/users/import/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import users');
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
        throw new Error('Export failed');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export users');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-grid">
        {/* Import Section */}
        <div className="admin-section">
          <h2 className="admin-title">Import Users</h2>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={importing}
              />
              <Button disabled={importing}>
                <UploadIcon />
                <span>{importing ? 'Importing...' : 'Upload Excel'}</span>
              </Button>
            </label>
          </div>

          {importResults && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                Processed {importResults.processed} users
              </p>
              {importResults.errors.length > 0 && (
                <div className="admin-error">
                  <div className="admin-error-text">
                    <AlertIcon />
                    <div className="flex-1">
                      <strong className="font-medium">Errors occurred:</strong>
                      <ul className="list-disc pl-4 mt-1 text-sm space-y-1">
                        {importResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="admin-section">
          <h2 className="admin-title">Export Users</h2>
          <Button onClick={handleExport} disabled={exportLoading}>
            <DownloadIcon />
            <span>{exportLoading ? 'Exporting...' : 'Export to Excel'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          <div className="admin-error-text">
            <AlertIcon />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserImportExport;