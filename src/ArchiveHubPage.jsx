import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocale, formatNumber as formatLocaleNumber } from './i18n/index.js'
import { useArchiveOverview } from './archive-overview.js'

export default function ArchiveHubPage(){
  const {characterCount,cardCount}=useArchiveOverview()
  const {t}=useTranslation('common')
  const locale=useLocale()
  const collections=[
    {route:'/archive/characters',title:'nav.characters',description:'archive.hubCharacters',count:characterCount},
    {route:'/archive/cw6-scene-cards',title:'nav.sceneCards',description:'archive.hubCards',count:cardCount},
  ]
  return(
    <div className="reference-hub archive-hub">
      <header className="reference-hub-head">
        <h1>{t('archive.title')}</h1>
        <p>{t('archive.hubIntro')}</p>
      </header>
      <nav className="reference-hub-grid" aria-label={t('archive.sections')}>
        {collections.map(collection=>(
          <Link className="reference-hub-card" key={collection.route} to={collection.route}>
            <h2>{t(collection.title)} <span className="reference-hub-count">{formatLocaleNumber(collection.count,locale)}</span></h2>
            <p>{t(collection.description)}</p>
            <span className="reference-hub-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>
      <Link className="reference-hub-more" to="/guide">{t('guide.contents')}</Link>
    </div>
  )
}
