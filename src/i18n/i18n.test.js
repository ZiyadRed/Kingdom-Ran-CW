import { describe, expect, it } from 'vitest'
import { getLocale } from './locales.js'
import { i18n, initI18n } from './i18n.js'

const en = getLocale('en')
const ja = getLocale('ja')
const ar = getLocale('ar')
const fr = getLocale('fr')

describe('i18next initialization', () => {
  it('initializes synchronously with English and serves the common catalog', () => {
    initI18n(en)
    expect(i18n.language).toBe('en')
    expect(i18n.t('common:appName')).toBe('RanHQ')
  })

  it('is safe to re-initialize with the same locale', () => {
    initI18n(en)
    expect(i18n.language).toBe('en')
    expect(i18n.t('common:appName')).toBe('RanHQ')
  })

  it('uses singular English copy for one general', async () => {
    initI18n(en)
    await i18n.changeLanguage('en')
    expect(i18n.t('common:generalCount', { count: 1 })).toBe('1 general')
    expect(i18n.t('common:selectedGenerals', { count: 1 })).toBe('1 selected general')
    expect(i18n.t('common:buffs.totalStackable', { count: 1 })).toBe('Total stackable buff from 1 general')
  })

  it('initializing with Japanese selects the Japanese catalog with English fallback', async () => {
    initI18n(ja)
    // changeLanguage is async on repeat inits; wait for it to settle.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(i18n.language).toBe('ja')
    expect(i18n.t('common:appName')).toBe('RanHQ')
    expect(i18n.t('common:nav.archive')).toBe('アーカイブ')
  })

  it('initializing with French selects the French catalog with English fallback', async () => {
    initI18n(fr)
    await i18n.changeLanguage('fr')
    expect(i18n.language).toBe('fr')
    expect(i18n.t('common:appName')).toBe('RanHQ')
    expect(i18n.t('common:nav.archive')).toBe('Archive')
    expect(i18n.t('common:guide.title')).toBe('Guide de la Conquête d’Alliance')
  })

  it('uses the French singular for 0 and 1, and the plural above', async () => {
    initI18n(fr)
    await i18n.changeLanguage('fr')
    // French CLDR puts 0 and 1 in the same `one` category.
    expect(i18n.t('common:generalCount', { count: 0 })).toBe('0 général')
    expect(i18n.t('common:generalCount', { count: 1 })).toBe('1 général')
    expect(i18n.t('common:generalCount', { count: 4 })).toBe('4 généraux')
    expect(i18n.t('common:selectedGenerals', { count: 1 })).toBe('1 général sélectionné')
    expect(i18n.t('common:castlePoints.castleCount', { count: 1 })).toBe('1 château')
    expect(i18n.t('common:castlePoints.castleCount', { count: 3 })).toBe('3 châteaux')
    expect(i18n.t('common:castlePoints.largeCastleCount', { count: 1 })).toBe('1 grand château')
    expect(i18n.t('common:castlePoints.pointsToday', { count: 1 })).toBe('1 point aujourd’hui')
  })

  it('uses explicit Arabic zero forms on every counted surface', async () => {
    initI18n(ar)
    await i18n.changeLanguage('ar')
    expect(i18n.t('common:generalCount', { count: 0 })).toBe('لا جنرالات')
    expect(i18n.t('common:selectedGenerals', { count: 0 })).toBe('لم يُحدد أي جنرال')
    expect(i18n.t('common:buffs.totalStackable', { count: 0 })).toBe('لا يوجد تعزيز قابل للتراكم')
    expect(i18n.t('common:castlePoints.allianceCount', { count: 0 })).toBe('لا تحالفات')
    expect(i18n.t('common:castlePoints.castleCount', { count: 0 })).toBe('لا قلاع')
    expect(i18n.t('common:castlePoints.largeCastleCount', { count: 0 })).toBe('لا قلاع كبيرة')
    expect(i18n.t('common:castlePoints.mediumCastleCount', { count: 0 })).toBe('لا قلاع متوسطة')
    expect(i18n.t('common:castlePoints.smallCastleCount', { count: 0 })).toBe('لا قلاع صغيرة')
    expect(i18n.t('common:castlePoints.pointsToday', { count: 0 })).toBe('لا نقاط اليوم')
    expect(i18n.t('common:castlePoints.behindFirst', { count: 0 })).toBe('لا فارق عن المركز الأول')
    expect(i18n.t('common:sim.description')).toContain('الجولة الأولى')
    expect(i18n.t('common:sim.openingRule')).toContain('القائد أولًا، ثم الاستراتيجي')
  })

  it('translates Castle Point tied-first semantics in every supported locale', async () => {
    initI18n(en)
    const expected = {
      en: [
        'Equal projected totals share a rank; row order does not break ties.',
        'Projected tied for 1st',
        'Your alliance shares the lead on this board.',
      ],
      ja: [
        '予測累計城獲得ポイントが同じ同盟は同率です。表示順では順位を決めません。',
        '予測同率1位',
        'このボードでは自同盟が同率首位です。',
      ],
      ar: [
        'التحالفات ذات الإجمالي المتوقع نفسه متعادلة؛ ترتيب الصفوف لا يحسم التعادل.',
        'تعادل متوقع في المركز الأول',
        'تحالفك يتقاسم صدارة هذه اللوحة.',
      ],
      fr: [
        'Les alliances au même total prévu sont ex æquo ; l’ordre des lignes ne les départage pas.',
        '1re place ex æquo prévue',
        'Votre alliance partage la tête de ce tableau.',
      ],
    }

    for (const [locale, messages] of Object.entries(expected)) {
      await i18n.changeLanguage(locale)
      expect([
        i18n.t('common:castlePoints.tieNote'),
        i18n.t('common:castlePoints.projectedTiedFirst'),
        i18n.t('common:castlePoints.tiedLeading'),
      ]).toEqual(messages)
    }
  })
})
