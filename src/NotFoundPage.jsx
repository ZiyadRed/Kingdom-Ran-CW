import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLocale } from './i18n/index.js'
import { canonicalPath, routeSeo, setSeo } from './seo.js'

export default function NotFoundPage(){
  const locale=useLocale()
  const location=useLocation()
  const copy=locale.code==='ja'
    ? {title:'ページが見つかりません',body:'指定されたRanHQのページは存在しないか、移動した可能性があります。',home:'ホームへ戻る',archive:'武将一覧を見る',guide:'攻略ガイドへ戻る'}
    : locale.code==='ar'
      ? {title:'الصفحة غير موجودة',body:'صفحة RanHQ المطلوبة غير موجودة أو ربما تم نقلها.',home:'العودة إلى الرئيسية',archive:'عرض قائمة الجنرالات',guide:'العودة إلى الدليل'}
      : locale.code==='fr'
        ? {title:'Page introuvable',body:'La page RanHQ demandée n’existe pas ou a été déplacée.',home:'Retour à l’accueil',archive:'Voir les généraux',guide:'Retour au guide'}
        : {title:'Page not found',body:'The requested RanHQ page does not exist or may have moved.',home:'Return home',archive:'Browse generals',guide:'Return to the guide'}
  const guide=canonicalPath(location.pathname).startsWith('/guide/')
  useEffect(()=>{setSeo(routeSeo(location.pathname,locale))},[location.pathname,locale])
  return(
    <div className="not-found-page">
      <p className="not-found-code">404</p>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      <div className="not-found-actions">
        <Link to="/">{copy.home}</Link>
        <Link to={guide?'/guide':'/archive/characters'}>{guide?copy.guide:copy.archive}</Link>
      </div>
    </div>
  )
}
