import { describe, expect, it } from 'vitest'
import { getLocale } from './locales.js'
import { i18n, initI18n } from './i18n.js'

const en = getLocale('en')
const ja = getLocale('ja')
const ar = getLocale('ar')

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
    expect(i18n.t('common:sim.leaderSkills')).toBe('مهارات القائد والاستراتيجي — الجولة الأولى')
  })
})
