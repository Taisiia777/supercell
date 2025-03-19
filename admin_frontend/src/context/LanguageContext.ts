
import { createContext, useContext } from 'react';

// Определяем тип для простых переводов
type Translation = {
  ru: string;
  zh: string;
};

type MailingTranslations = {
  title: Translation;
  messageLabel: Translation;
  messagePlaceholder: Translation;
  imageLabel: Translation;
  uploadImage: Translation;
  scheduledSending: Translation;
  sending: Translation;
  sendMailing: Translation;
  scheduleMailing: Translation;
  success: {
    sent: Translation;
    scheduled: Translation;
    totalUsers: Translation;
    successCount: Translation;
    errorCount: Translation;
  };
  errors: {
    general: Translation;
    unknown: Translation;
  };
};

// Типы для Excel
type ExcelTranslations = {
  import: {
    title: Translation;
    button: Translation;
    importing: Translation;
    processed: Translation;
    errors: Translation;
    errorOccurred: Translation;
  };
  export: {
    title: Translation;
    button: Translation;
    exporting: Translation;
  };
  errors: {
    importFailed: Translation;
    exportFailed: Translation;
  };
};


type TableTranslations = {
  products: {
    title: Translation;
    columns: {
      name: Translation;
      description: Translation;
      seller: Translation;
      salesCount: Translation;
      price: Translation;
    };
    filters: {
      game: Translation;
    };
    actions: {
      add: Translation;
      goto: Translation;
      delete: Translation;
      deleteConfirm: Translation;
    };
    // Новые поля для продуктов
    orderStatuses: {
      NEW: Translation;
      PAID: Translation;
      PROCESSING: Translation;
      SENT: Translation;
      DELIVERED: Translation;
      REFUND: Translation;
      CANCELLED: Translation;
      READY: Translation;
    };
    productStates: {
      visibility: {
        active: Translation;
        hidden: Translation;
      };
      loginTypes: {
        EMAIL_CODE: Translation;
        LINK: Translation;
      };
    };
    changes: {
      loginDataChanged: Translation;
      newOrder: Translation;
      emailChanged: Translation;
      codeChanged: Translation;
    };
    tableInterface: {
      actions: {
        view: Translation;
        edit: Translation;
        delete: Translation;
        confirm: Translation;
        cancel: Translation;
      };
      messages: {
        noData: Translation;
        loading: Translation;
        error: Translation;
        deleteConfirmation: Translation;
      };
      filters: {
        resetFilter: Translation;
        search: Translation;
        apply: Translation;
      };
      pagination: {
        prev: Translation;
        next: Translation;
        showing: Translation;
        of: Translation;
        entries: Translation;
      };
    };
  };
  orders: {
    title: Translation;
    columns: {
      orderNumber: Translation;
      dateTime: Translation;
      status: Translation;
      clientId: Translation;
      sum: Translation;
    };
    filters: {
      status: Translation;
      orderDate: Translation;
    };
    notSpecified: Translation;
    search: SearchTranslations;
  };
  common: {
    empty: Translation;
  };
};
type SearchTranslations = {
  placeholder: Translation;
  byOrderNumber: Translation;
  byTelegramId: Translation;
};

// Определяем тип для ошибок формы продукта
type ProductFormErrors = {
  titleLength: Translation;
  selectGameRequired: Translation;
  selectUnitRequired: Translation;
  priceRange: Translation;
  promoPriceRange: Translation;
  promoPriceLower: Translation;
  maxFiles: Translation;
  wrongFormat: Translation;
};

// Определяем тип для формы продукта
type ProductForm = {
  name: Translation;
  namePlaceholder: Translation;
  general: Translation;
  gameName: Translation;
  selectGame: Translation;
  price: Translation;
  promoPrice: Translation;
  unit: Translation;
  selectUnit: Translation;
  withLogin: Translation;
  withoutLogin: Translation;
  withlinkLogin: Translation;
  photos: Translation;
  description: Translation;
  productDescription: Translation;
  notFilled: Translation;
  errors: ProductFormErrors;
};

type OrderReaderTranslations = {
  orderNumber: Translation;
  orderDate: Translation;
  updateDate: Translation;
  paymentSection: Translation; // Заголовок секции о платеже
  paymentCode: Translation;
  payment: Translation; // Заголовок секции оплаты
  paymentMethod: Translation;
  creditCard: Translation;
  notesSection: Translation; // Заголовок секции заметок
  notes: Translation; // Метка поля заметок
  notesPlaceholder: Translation;
  noNotes: Translation;
  orderDetails: Translation; // Заголовок секции деталей заказа
  email: Translation;
  friendLink: Translation;
  withLogin: Translation;
  withoutLogin: Translation;
  withLoginAndLink: Translation;
  withoutLoginAndLink: Translation;
  unknownType: Translation;
  piece: Translation; // Единица измерения "шт."
  account: Translation;
  inviteLink: Translation;
  code: Translation;
  sendNewCode: Translation; // Текст кнопки отправки нового кода
  codeSent: Translation; // Сообщение об успешной отправке кода
  loading: Translation;
  submit: Translation; // Текст кнопки отправки формы
  itemCountDeclensions: {
    one: Translation;
    few: Translation;
    many: Translation;
  };
  changes: {
    emailChanged: Translation;
    linkChanged: Translation;
    codeChanged: Translation;
  };
};

interface Translations {
  cancel: Translation;
  edit: Translation;
  save: Translation;
  productCard: Translation;
  orderCard: Translation;
  mainPage: Translation;
  products: Translation;
  orders: Translation;
  mailing: Translation;
  excel: Translation;
  productForm: ProductForm;
  table: TableTranslations;
  mailingTranslations: MailingTranslations;
  excelTranslations: ExcelTranslations;
  orderReader: OrderReaderTranslations;
  search: SearchTranslations;

}

// Обновляем основной интерфейс
interface LanguageContextType {
  language: 'ru' | 'zh';
  setLanguage: (lang: 'ru' | 'zh') => void;
  translations: Translations;
}

export const translations: Translations = {
  cancel: {
    ru: 'Отмена',
    zh: '取消'
  },
  edit: {
    ru: 'Редактировать',
    zh: '编辑'
  },
  save: {
    ru: 'Сохранить',
    zh: '保存'
  },
  // Заголовки для разных страниц
  productCard: {
    ru: 'Карточка товара',
    zh: '产品卡'
  },
  orderCard: {
    ru: 'Карточка заказа',
    zh: '订单卡'
  },
  mainPage: {
    ru: 'Главная',
    zh: '首页'
  },
  products: {
    ru: 'Товары',
    zh: '产品'
  },
  orders: {
    ru: 'Заказы',
    zh: '订单'
  },
  mailing: {
    ru: 'Рассылка',
    zh: '邮件'
  },
  excel: {
    ru: 'Excel',
    zh: '表格'
  },

  productForm: {
    name: {
      ru: 'Название',
      zh: '名称'
    },
    namePlaceholder: {
      ru: 'Заполните название',
      zh: '填写名称'
    },
    general: {
      ru: 'Общее',
      zh: '基本信息'
    },
    gameName: {
      ru: 'Наименование игры',
      zh: '游戏名称'
    },
    selectGame: {
      ru: 'Выберите игру',
      zh: '选择游戏'
    },
    price: {
      ru: 'Стоимость',
      zh: '价格'
    },
    promoPrice: {
      ru: 'Акционная цена',
      zh: '促销价'
    },
    unit: {
      ru: 'Единица измерения',
      zh: '计量单位'
    },
    selectUnit: {
      ru: 'Выберите измерение',
      zh: '选择单位'
    },
    withLogin: {
      ru: 'С входом',
      zh: '需要登录'
    },
    withoutLogin: {
      ru: 'Без входа',
      zh: '无需登录'
    },
    withlinkLogin: {
      ru: 'Ссылка',
      zh: '链接'
      },
    photos: {
      ru: 'Фото товара',
      zh: '商品图片'
    },
    description: {
      ru: 'Описание',
      zh: '描述'
    },
    productDescription: {
      ru: 'Общее описание товара',
      zh: '商品总体描述'
    },
    notFilled: {
      ru: 'Не заполнено',
      zh: '未填写'
    },
    errors: {
      titleLength: {
        ru: 'Длина строки от 3 до 30 символов',
        zh: '标题长度应在3到30个字符之间'
      },
      selectGameRequired: {
        ru: 'Выберите игру',
        zh: '请选择游戏'
      },
      selectUnitRequired: {
        ru: 'Выберите единицу измерения',
        zh: '请选择计量单位'
      },
      priceRange: {
        ru: 'Введите стоимость от 10 ₽ до 100 000 ₽',
        zh: '请输入10卢布到100000卢布之间的价格'
      },
      promoPriceRange: {
        ru: 'Акционная цена должна быть от 10 ₽ до 100 000 ₽',
        zh: '促销价格必须在10卢布到100000卢布之间'
      },
      promoPriceLower: {
        ru: 'Акционная цена должна быть ниже стоимости товара',
        zh: '促销价格必须低于商品原价'
      },
      maxFiles: {
        ru: 'Выберите не более 4х файлов',
        zh: '最多选择4个文件'
      },
      wrongFormat: {
        ru: 'Неверный формат',
        zh: '格式错误'
      }
    }
  },
  table: {
    products: {
      title: {
        ru: 'Товары',
        zh: '产品'
      },
      columns: {
        name: {
          ru: 'Наименование',
          zh: '名称'
        },
        description: {
          ru: 'Описание',
          zh: '描述'
        },
        seller: {
          ru: 'Продавец',
          zh: '卖家'
        },
        salesCount: {
          ru: 'Кол-во продаж',
          zh: '销售数量'
        },
        price: {
          ru: 'Стоимость',
          zh: '价格'
        }
      },
      filters: {
        game: {
          ru: 'Игра',
          zh: '游戏'
        }
      },
      actions: {
        add: {
          ru: 'Добавить',
          zh: '添加'
        },
        goto: {
          ru: 'Перейти',
          zh: '查看'
        },
        delete: {
          ru: 'Удалить',
          zh: '删除'
        },
        deleteConfirm: {
          ru: 'Удалить товар?',
          zh: '确定删除产品？'
        }
      },
orderStatuses: {
  NEW: {
    ru: "Ожидает оплаты",
    zh: "等待付款"
  },
  PAID: {
    ru: "Оплачен. Ожидает обработки",
    zh: "已付款，等待处理"
  },
  PROCESSING: {
    ru: "Оплачен. В процессе обработки",
    zh: "已付款，处理中"
  },
  SENT: {
    ru: "Отправлен",
    zh: "已发货"
  },
  DELIVERED: {
    ru: "Завершен",
    zh: "已完成"
  },
  REFUND: {
    ru: "Возврат",
    zh: "已退款"
  },
  CANCELLED: {
    ru: "Отменен",
    zh: "已取消"
  },
  READY: {
    ru: "Готов",
    zh: "已准备"
  }
},

// Переводы для состояний товаров
productStates: {
  visibility: {
    active: {
      ru: "Активен",
      zh: "可见"
    },
    hidden: {
      ru: "Скрыт",
      zh: "隐藏"
    }
  },
  loginTypes: {
    EMAIL_CODE: {
      ru: "С входом",
      zh: "需要登录"
    },
    LINK: {
      ru: "Без входа",
      zh: "无需登录"
    }
  }
},

// Индикаторы изменений
changes: {
  loginDataChanged: {
    ru: "Данные для входа изменены",
    zh: "登录数据已更改"
  },
  newOrder: {
    ru: "Новый заказ",
    zh: "新订单"
  },
  emailChanged: {
    ru: "Email изменен",
    zh: "邮箱已更改"
  },
  codeChanged: {
    ru: "Код изменен",
    zh: "验证码已更改"
  }
},

tableInterface: {
  actions: {
    view: {
      ru: "Просмотр",
      zh: "查看"
    },
    edit: {
      ru: "Редактировать",
      zh: "编辑"
    },
    delete: {
      ru: "Удалить",
      zh: "删除"
    },
    confirm: {
      ru: "Подтвердить",
      zh: "确认"
    },
    cancel: {
      ru: "Отмена",
      zh: "取消"
    }
  },
  messages: {
    noData: {
      ru: "Нет данных для отображения",
      zh: "没有可显示的数据"
    },
    loading: {
      ru: "Загрузка данных...",
      zh: "正在加载数据..."
    },
    error: {
      ru: "Ошибка при загрузке данных",
      zh: "加载数据时出错"
    },
    deleteConfirmation: {
      ru: "Вы уверены, что хотите удалить этот товар?",
      zh: "您确定要删除此产品吗？"
    }
  },
  filters: {
    resetFilter: {
      ru: "Сбросить",
      zh: "重置"
    },
    search: {
      ru: "Поиск",
      zh: "搜索"
    },
    apply: {
      ru: "Применить",
      zh: "应用"
    }
  },
  pagination: {
    prev: {
      ru: "Предыдущая",
      zh: "上一页"
    },
    next: {
      ru: "Следующая",
      zh: "下一页"
    },
    showing: {
      ru: "Показано",
      zh: "显示"
    },
    of: {
      ru: "из",
      zh: "共"
    },
    entries: {
      ru: "записей",
      zh: "条记录"
    }
  }
},
    },
    orders: {
      title: {
        ru: 'Заказы',
        zh: '订单'
      },
      columns: {
        orderNumber: {
          ru: '№ заказа',
          zh: '订单号'
        },
        dateTime: {
          ru: 'Дата и время',
          zh: '日期时间'
        },
        status: {
          ru: 'Статус',
          zh: '状态'
        },
        clientId: {
          ru: 'Telegram ID Клиента',
          zh: '客户 Telegram ID'
        },
        sum: {
          ru: 'Сумма',
          zh: '金额'
        }
      },
      filters: {
        status: {
          ru: 'Статус',
          zh: '状态'
        },
        orderDate: {
          ru: 'Дата заказа',
          zh: '订单日期'
        }
      },
      notSpecified: {
        ru: 'Не указан',
        zh: '未指定'
      },
      search: {
        placeholder: {
          ru: 'Поиск...',
          zh: '搜索...'
        },
        byOrderNumber: {
          ru: 'По номеру заказа',
          zh: '按订单号'
        },
        byTelegramId: {
          ru: 'По Telegram ID',
          zh: '按Telegram ID'
        }
      }
    },
    common: {
      empty: {
        ru: '(пусто)',
        zh: '(空)'
      }
    }
  },
  mailingTranslations: {
    title: {
      ru: 'Массовая рассылка',
      zh: '群发消息'
    },
    messageLabel: {
      ru: 'Текст сообщения',
      zh: '消息内容'
    },
    messagePlaceholder: {
      ru: 'Введите текст сообщения...',
      zh: '请输入消息内容...'
    },
    imageLabel: {
      ru: 'Изображение (опционально)',
      zh: '图片（可选）'
    },
    uploadImage: {
      ru: 'Загрузить изображение',
      zh: '上传图片'
    },
    scheduledSending: {
      ru: 'Отложенная отправка',
      zh: '定时发送'
    },
    sending: {
      ru: 'Отправка...',
      zh: '发送中...'
    },
    sendMailing: {
      ru: 'Отправить рассылку',
      zh: '发送消息'
    },
    scheduleMailing: {
      ru: 'Запланировать рассылку',
      zh: '预约发送'
    },
    success: {
      sent: {
        ru: 'Рассылка успешно отправлена!',
        zh: '消息发送成功！'
      },
      scheduled: {
        ru: 'Рассылка успешно запланирована!',
        zh: '消息预约成功！'
      },
      totalUsers: {
        ru: 'Всего пользователей',
        zh: '总用户数'
      },
      successCount: {
        ru: 'Успешно отправлено',
        zh: '发送成功'
      },
      errorCount: {
        ru: 'Ошибок',
        zh: '发送失败'
      }
    },
    errors: {
      general: {
        ru: 'Произошла ошибка при отправке рассылки',
        zh: '发送消息时出错'
      },
      unknown: {
        ru: 'Произошла неизвестная ошибка',
        zh: '发生未知错误'
      }
    }
  },
  excelTranslations: {
    import: {
      title: {
        ru: 'Импорт пользователей',
        zh: '导入用户'
      },
      button: {
        ru: 'Загрузить Excel',
        zh: '上传 Excel'
      },
      importing: {
        ru: 'Импортирование...',
        zh: '导入中...'
      },
      processed: {
        ru: 'Обработано пользователей',
        zh: '已处理用户'
      },
      errors: {
        ru: 'Произошли ошибки',
        zh: '发生错误'
      },
      errorOccurred: {
        ru: 'Возникли ошибки:',
        zh: '出现错误：'
      }
    },
    export: {
      title: {
        ru: 'Экспорт пользователей',
        zh: '导出用户'
      },
      button: {
        ru: 'Экспорт в Excel',
        zh: '导出到 Excel'
      },
      exporting: {
        ru: 'Экспортирование...',
        zh: '导出中...'
      }
    },
    errors: {
      importFailed: {
        ru: 'Не удалось импортировать пользователей',
        zh: '导入用户失败'
      },
      exportFailed: {
        ru: 'Не удалось экспортировать пользователей',
        zh: '导出用户失败'
      }
    }
  },
  orderReader: {
    orderNumber: {
      ru: 'Номер заказа',
      zh: '订单号'
    },
    orderDate: {
      ru: 'Дата заказа',
      zh: '下单日期'
    },
    updateDate: {
      ru: 'Дата изменения',
      zh: '更新日期'
    },
    paymentSection: {
      ru: 'О платеже',
      zh: '支付信息'
    },
    paymentCode: {
      ru: 'Код платежа',
      zh: '支付编码'
    },
    payment: {
      ru: 'Оплата',
      zh: '支付'
    },
    paymentMethod: {
      ru: 'Способ оплаты',
      zh: '支付方式'
    },
    creditCard: {
      ru: 'Кредитная карта',
      zh: '信用卡'
    },
    notesSection: {
      ru: 'Заметки к заказу',
      zh: '订单备注'
    },
    notes: {
      ru: 'Заметки',
      zh: '备注'
    },
    notesPlaceholder: {
      ru: 'Введите заметки к заказу...',
      zh: '请输入订单备注...'
    },
    noNotes: {
      ru: 'Нет заметок',
      zh: '无备注'
    },
    orderDetails: {
      ru: 'Детали заказа',
      zh: '订单详情'
    },
    email: {
      ru: 'Почта',
      zh: '邮箱'
    },
    friendLink: {
      ru: 'Ссылка в друзья',
      zh: '好友邀请链接'
    },
    withLogin: {
      ru: 'С входом',
      zh: '需要登录'
    },
    withoutLogin: {
      ru: 'Без входа',
      zh: '无需登录'
    },
    withLoginAndLink: {
      ru: 'С входом + ссылка',
      zh: '需要登录 + 链接'
    },
    withoutLoginAndLink: {
      ru: 'Без входа + ссылка',
      zh: '无需登录 + 链接'
    },
    unknownType: {
      ru: 'Неизвестный тип',
      zh: '未知类型'
    },
    piece: {
      ru: 'шт.',
      zh: '件'
    },
    account: {
      ru: 'Аккаунт',
      zh: '账号'
    },
    inviteLink: {
      ru: 'Пригласительная ссылка',
      zh: '邀请链接'
    },
    code: {
      ru: 'Код',
      zh: '验证码'
    },
    sendNewCode: {
      ru: 'Отправить новый код',
      zh: '发送新验证码'
    },
    codeSent: {
      ru: 'Код отправлен',
      zh: '验证码已发送'
    },
    loading: {
      ru: 'Загрузка данных',
      zh: '加载数据中'
    },
    submit: {
      ru: 'Отправить',
      zh: '提交'
    },
    itemCountDeclensions: {
      one: {
        ru: 'товар',
        zh: '件商品'
      },
      few: {
        ru: 'товара',
        zh: '件商品'
      },
      many: {
        ru: 'товаров',
        zh: '件商品'
      }
    },
    changes: {
      emailChanged: {
        ru: 'Email был изменен',
        zh: '邮箱已更改'
      },
      linkChanged: {
        ru: 'Ссылка была изменена',
        zh: '链接已更改'
      },
      codeChanged: {
        ru: 'Код был изменен',
        zh: '验证码已更改'
      }
    }
  },
 
  search: {
    placeholder: {
      ru: 'Поиск...',
      zh: '搜索...'
    },
    byOrderNumber: {
      ru: 'По номеру заказа',
      zh: '按订单号'
    },
    byTelegramId: {
      ru: 'По Telegram ID',
      zh: '按Telegram ID'
    }
  }
  
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'ru',
  setLanguage: () => {},
  translations
});

export const useLanguage = () => useContext(LanguageContext);