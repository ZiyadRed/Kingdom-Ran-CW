import { useTranslation } from 'react-i18next'
import Dialog from './Dialog.jsx'

// Small overlay button placed on a scene-card image to open full-resolution art.
export function ViewArtButton({onClick,style}){
  const{t}=useTranslation('common')
  return(
    <button
      type="button"
      title={t('viewArt')}
      aria-label={t('viewArt')}
      onClick={onClick}
      style={{
        position:'absolute',top:7,right:7,zIndex:4,
        width:26,height:26,minHeight:0,padding:0,cursor:'pointer',
        display:'inline-flex',alignItems:'center',justifyContent:'center',
        borderRadius:'50%',border:'1.5px solid rgba(255,255,255,.85)',
        background:'rgba(6,38,76,.45)',color:'#fff',
        WebkitBackdropFilter:'blur(3px)',backdropFilter:'blur(3px)',
        boxShadow:'0 1px 5px rgba(0,0,0,.28)',
        ...style,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
      </svg>
    </button>
  )
}

// Full-screen lightbox showing an image at full resolution. Click backdrop / Esc to close.
export function ArtLightbox({src,alt,onClose}){
  const{t}=useTranslation('common')
  if(!src) return null
  return(
    <Dialog
      onClose={onClose}
      aria-label={alt||t('archive.cardArt')}
      style={{
        position:'fixed',inset:0,zIndex:1000,
        background:'rgba(0,0,0,.85)',cursor:'zoom-out',
        display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',
      }}
    >
      <img
        src={src} alt={alt||''}
        onClick={e=>e.stopPropagation()}
        style={{maxWidth:'95vw',maxHeight:'95vh',objectFit:'contain',cursor:'default',
          borderRadius:8,boxShadow:'0 10px 50px rgba(0,0,0,.6)'}}
      />
      <button
        type="button" onClick={onClose} aria-label={t('close')}
        style={{position:'fixed',top:16,right:18,width:40,height:40,borderRadius:'50%',
          border:'1px solid rgba(255,255,255,.3)',background:'rgba(0,0,0,.5)',color:'#fff',
          fontSize:'1.5rem',lineHeight:1,cursor:'pointer'}}
      >{'×'}</button>
      <a
        href={src} target="_blank" rel="noopener noreferrer"
        onClick={e=>e.stopPropagation()}
        style={{position:'fixed',bottom:18,left:'50%',transform:'translateX(-50%)',
          fontSize:'.72rem',color:'rgba(255,255,255,.82)',textDecoration:'underline'}}
      >{t('openOriginal')}</a>
    </Dialog>
  )
}
