import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageContent, PageContentDocument } from './page-content.schema';

const DEFAULTS: Record<string, Record<string, unknown>> = {
  about: {
    heroTitle: 'ORTHOSTORE – ВСЕ ДЛЯ СУЧАСНОЇ ОРТОДОНТІЇ',
    heroSubtitle: 'Ваш надійний партнер у сфері ортодонтичної продукції з 2015 року',
    story: [
      'ORTHOSTORE – ЦЕ НАДІЙНИЙ ПАРТНЕР З ГАЛУЗІ ОРТОДОНТИЧНОЇ ПРОДУКЦІЇ.',
      'Ми вийшли на цей ринок в 2015 році з головною метою – задовільнити Ваші потреби в якісній ортодонтичній продукції. Ми не просто пропонуємо товари — ми ділимося тим, у що справді віримо.',
      'Ми постійно стежимо за інноваціями в сфері ортодонтії та підберемо Вам найкращий варіант з широкого асортименту ортодонтичної продукції та інструментів. Надаємо індивідуальний підхід до кожного клієнта, проконсультуємо, допоможемо в виборі ідеального варіанта.',
      'Ми з повагою ставимося як до великих компаній, цінуємо їхній досвід і готові поставити будь-яку кількість ортодонтичної продукції, так і до кожного лікаря, який бажає працювати з нами. Інтернет-магазин ортодонтичної продукції ORTHOSTORE слідкує за іноваціями у своїй сфері діяльності і пропонує продукцію високої якості від провідних світових брендів.',
    ],
    pricingIntro:
      'Для постійних клієнтів передбачені знижки, подарунки та інші приємні сюрпризи. В умовах кризи і нестабільності наш магазин підтримує лояльну цінову політику щоб і професіонал і молодий фахівець знайшли необхідну продукцію на будь-який бюджет.',
    segments: [
      {
        number: '01',
        title: 'Бюджетний сегмент',
        desc: 'Товари з достатніми для роботи характеристиками за доступними цінами.',
      },
      {
        number: '02',
        title: 'Середній ціновий клас',
        desc: 'Оптимальне співвідношенням ціна-якість для щоденної практики.',
      },
      {
        number: '03',
        title: 'Преміум сегмент',
        desc: 'Для фахівців найвищого рівня, які мають високі вимоги до функціоналу і надійності матеріалів і інструментів.',
      },
    ],
    ctaTitle: 'З нами зручно, легко та швидко!',
    ctaSubtitle: 'Щиро дякуємо за довіру до ORTHOSTORE!',
  },

  delivery: {
    heroTitle: 'Доставка та оплата',
    heroSubtitle:
      'Продумана до дрібниць логістика, дає можливість швидко та ефективно доставити Вам придбану продукцію !',
    managerNote: 'Наші менеджери заздалегідь погодять з Вами зручний час доставки!',
    kyivTitle: 'Доставка по Києву та Київській області',
    kyivHours: "Здійснюється з понеділка по п'ятницю з 9.00 до 18.00",
    kyivItems: [
      'Доставка по Києву до 3000 грн оплачується! Вартість доставки 100 грн.',
      'Доставка по Києву від 3000 грн – БЕЗКОШТОВНА !',
      'Доставка по Київській області оплачується! Вартість доставки 200 грн.',
    ],
    ukraineTitle: 'Відправлення по Україні',
    ukraineItems: [
      "Здійснюється кур'єрськими службами: НОВА ПОШТА, УКРПОШТА або іншою службою, погодженою з замовником.",
      'Відправлення по Україні здійснюється після повної оплати.',
      'Відправлення по Україні до 3500 грн відправляється за рахунок замовника.',
      'Відправлення по Україні від 3500 грн відправляється за рахунок відправника.',
    ],
    shippingNote:
      'Відвантаження здійснюється в день надходження замовлення, на наступний робочий день або за графіком домовленості, погодженим із замовником.',
    minOrder: 'Мінімальна сума замовлення – 300 грн',
    paymentIntro: 'Оплату товару можна здійснити наступними способами:',
    paymentMethods: ['Оплата при доставці кур\'єру', 'Оплата на розрахунковий рахунок'],
    returnItems: [
      'ПОВЕРНЕННЯ АБО ОБМІН можливі протягом 14 днів з моменту отримання замовлення',
      "Зв'яжіться з нашим менеджером за телефоном +380503039494 та повідомити про намір повернення, компанія залишає за собою право індивідуального розгляду звернення та погодження повернення",
      'Наявність рахунку, що підтверджує замовлення в ORTHOSTORE',
    ],
    defectSteps: [
      "Зв'яжіться з нами протягом 3 днів з моменту отримання замовлення",
      'Надішліть фото або відео, що підтверджують дефект',
      'Ми зробимо заміну товару протягом 3-5 робочих днів',
    ],
  },

  'contacts-page': {
    heroTitle: 'Готові відповісти\nна усі ваші питання',
    heroSubtitle:
      'Наша команда завжди готова надати професійну консультацію та підтримку у виборі ортодонтичних матеріалів.',
    heroButtonText: "Як з нами зв'язатись",
    contactMethods: [
      {
        type: 'phone',
        title: 'Телефон',
        primary: '+38 050 303 94 94',
        secondary: 'Пн-Пт 9:00-18:00',
        description: 'Дзвонити в робочий час для отримання консультацій',
        action: 'Дзвонити',
        href: 'tel:+380503039494',
      },
      {
        type: 'email',
        title: 'Email',
        primary: 'orthostore.com.ua@gmail.com',
        secondary: '',
        description: "Відправте запрос - в найближчий час ми з вами зв'яжемось",
        action: 'Написати',
        href: 'mailto:orthostore.com.ua@gmail.com',
      },
      {
        type: 'chat',
        title: 'Онлайн-чат',
        primary: 'Миттєва підтримка',
        secondary: 'Пн-Пт 9:00-18:00',
        description: 'Швидкі відповіді на ваші питання',
        action: 'Відкрити чат',
        href: 'https://t.me/orthostore',
      },
      {
        type: 'meeting',
        title: 'Зустріч',
        primary: 'Особистий візит',
        secondary: 'За особистим записом',
        description: 'Огляд продукції та тест інструментів',
        action: 'Домовитись',
        href: '#contact-form',
      },
    ],
    locationTitle: 'Наша локація',
    address: 'м. Київ, вул. Саксаганського, 54/56',
    workingHours: [
      { day: "Понеділок-П'ятниця", hours: '9:00 - 18:00' },
      { day: 'Субота-Неділя', hours: 'Замовлення онлайн' },
    ],
    howToGetMetro:
      'Метро: Університет (10 хв), Палац Спорту (10 хв), Площа Українських Героїв (10 хв)',
    howToGetTransport:
      "Громадський транспорт: 3, 69, 14, 171 (зупинка - готель Кооператор) від метро Палац Спорту",
    howToGetParking: 'Парковка: доступна біля офісу',
    destinationUrl:
      'https://www.google.com/maps/dir/?api=1&destination=50.4391,30.51573',
    openMapUrl:
      'https://www.google.com/maps/search/?api=1&query=%D0%B2%D1%83%D0%BB.%20%D0%A1%D0%B0%D0%BA%D1%81%D0%B0%D0%B3%D0%B0%D0%BD%D1%81%D1%8C%D0%BA%D0%BE%D0%B3%D0%BE%2054%2F56%2C%20%D0%9A%D0%B8%D1%97%D0%B2',
    embedMapUrl:
      'https://maps.google.com/maps?q=%D0%B2%D1%83%D0%BB.+%D0%A1%D0%B0%D0%BA%D1%81%D0%B0%D0%B3%D0%B0%D0%BD%D1%81%D1%8C%D0%BA%D0%BE%D0%B3%D0%BE+54/56,+%D0%9A%D0%B8%D1%97%D0%B2&z=17&output=embed',
  },

  'promotions-section': {
    sectionTitle: 'Акційні пропозиції',
    countdownLabel: 'До кінця акції',
    countdownSublabel: 'Встигніть замовити!',
    priceLabel: 'Акційна ціна',
    orderBtnText: 'Замовити зараз',
    detailsBtnText: 'Деталі',
    showAllBtnText: 'Усі акційні пропозиції',
    collapseBtnText: 'Згорнути',
    sliderIds: [],
    gridIds: [],
  },
};

@Injectable()
export class PagesService implements OnModuleInit {
  constructor(
    @InjectModel(PageContent.name) private readonly model: Model<PageContentDocument>,
  ) {}

  async onModuleInit() {
    // Seed defaults if not yet in DB
    for (const [key, data] of Object.entries(DEFAULTS)) {
      await this.model.updateOne({ key }, { $setOnInsert: { key, data } }, { upsert: true });
    }
  }

  async getByKey(key: string): Promise<Record<string, unknown>> {
    const doc = await this.model.findOne({ key }).lean();
    return (doc?.data as Record<string, unknown>) ?? (DEFAULTS[key] ?? {});
  }

  async upsertByKey(key: string, data: Record<string, unknown>): Promise<PageContent> {
    const doc = await this.model
      .findOneAndUpdate({ key }, { $set: { data } }, { upsert: true, new: true })
      .lean();
    return doc as unknown as PageContent;
  }
}
