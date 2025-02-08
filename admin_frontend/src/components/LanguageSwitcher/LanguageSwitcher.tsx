import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'zh' : 'ru');
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="language-switcher"
    >
      {/* <img 
        src={`/images/${language === 'ru' ? 'ru' : 'cn'}-flag.png`}
        alt={language === 'ru' ? 'Русский' : '中文'}
      /> */}
      <span>
        {language === 'ru' ? 'RU' : 'CN'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;