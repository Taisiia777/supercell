// MassMailingPage.tsx
import React from 'react';
import UserImportExport from '../../components/ExcelUpload/UserImportExport';

const ExcelPage: React.FC = () => {
  return (
    <div className="p-6">
        <UserImportExport/>
    </div>
  );
};

export default ExcelPage;