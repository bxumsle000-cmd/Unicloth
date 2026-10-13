import { useState } from 'react'
import { useLanguage } from '../js/i18n.js';

/** 主視覺輪播的三支影片 */
const HERO_VIDEOS = ['/video/hero-01.mp4', '/video/hero-02.mp4', '/video/hero-03.mp4'];

/** 三個系列大圖（alt 放字典的 key） */
const LOOKS = [
    { code: 'all_women', img: '/img/look-01.png', alt: 'lookWomen' },
    { code: 'all_men', img: '/img/look-02.png', alt: 'lookMen' },
    { code: 'all_kids', img: '/img/look-03.png', alt: 'lookKids' },
];

function Home() {
    const { t } = useLanguage();

    // 目前播第幾支影片（從 0 開始）
    const [heroIndex, setHeroIndex] = useState(0);

    /** 切換影片：step 是 -1（上一支）或 1（下一支），超出頭尾就不動 */
    function changeHeroVideo(step) {
        const targetIndex = heroIndex + step;
        if (targetIndex < 0 || targetIndex >= HERO_VIDEOS.length) return;
        setHeroIndex(targetIndex);
    }

    return (
        <div className="bg-paper font-kinu text-[14px] text-black">
        {/* 主視覺影片 */}
        <section className="relative h-[min(68vw,760px)] min-h-[540px] w-full overflow-hidden
                            max-[760px]:h-[78vh] max-[760px]:min-h-[530px]">
            <video src={HERO_VIDEOS[heroIndex]} poster="/img/campaign.jpg"
                   autoPlay muted playsInline
                   onEnded={() => changeHeroVideo(1)}
                   className="absolute inset-0 size-full object-cover object-[center_42%] saturate-[.73]
                              max-[760px]:object-[58%_center]" />

            {/* 漸層遮罩：讓白字在影片上看得清楚 */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(25,22,19,.35),transparent_72%)]
                            max-[760px]:bg-[linear-gradient(0deg,rgba(0,0,0,.5),transparent_82%)]"></div>

            {/* 影片內文 */}
            <div className="absolute top-1/2 left-[8%] z-10 max-w-[440px] -translate-y-[43%] text-white
                            max-[760px]:top-auto max-[760px]:bottom-[13%] max-[760px]:left-[7%] max-[760px]:max-w-[300px] max-[760px]:translate-y-0">
                <div className="text-[10px] tracking-[.23em] uppercase">THE ART OF EVERYDAY</div>
                <h1 className="mt-[18px] mb-[15px] text-[clamp(38px,5.3vw,72px)] font-normal leading-[1.18] tracking-[.03em] max-[760px]:text-[47px]">
                    {t('heroTitle1')}<br />{t('heroTitle2')}
                </h1>
                <p className="text-xs leading-[2] tracking-[.07em]">
                    {t('heroText1')}<br />{t('heroText2')}
                </p>
            </div>

            {/* 輪播切換：‹ 01 / 03 › ●○○ */}
            <div className="absolute right-[5%] bottom-[26px] z-10 flex items-center gap-2 text-[10px] tracking-[.15em] text-white">
                <button onClick={() => changeHeroVideo(-1)} aria-label={t('prevVideo')} className="text-[22px]">‹</button>
                <span>0{heroIndex + 1}　/　0{HERO_VIDEOS.length}</span>
                <button onClick={() => changeHeroVideo(1)} aria-label={t('nextVideo')} className="text-[22px]">›</button>
                <span>　{HERO_VIDEOS.map((_, videoIndex) => videoIndex === heroIndex ? '●' : '○').join('　')}</span>
            </div>
        </section>

        {/* 中間標語 */}
        <div className="flex items-center justify-center gap-[34px] px-3 py-[23px] text-[9px] tracking-[.18em] text-[#6f6963]
                        max-[760px]:flex-wrap max-[760px]:gap-3 max-[760px]:text-[7px] max-[760px]:tracking-[.08em]">
            <span>MADE FOR YOUR EVERYDAY</span>
            <i className="size-[3px] rounded-full bg-[#a9a198]"></i>
            <span>{t('tagline')}</span>
            <i className="size-[3px] rounded-full bg-[#a9a198]"></i>
            <span>LESS, BUT BETTER</span>
        </div>

        {/* 系列大圖 */}
        <section id="collections">
            {LOOKS.map((look) => (
                <div key={look.code}
                   className="relative mb-[72px] block aspect-[2/1] w-full overflow-hidden bg-stone max-[760px]:mb-12">
                    <img src={look.img} alt={t(look.alt)} className="size-full object-cover object-[center_42%]" />
                </div>
            ))}
        </section>

        {/* 秋冬預告 */}
        <section className="relative h-[min(63vw,760px)] min-h-[510px] overflow-hidden text-white
                            max-[760px]:h-[68vh] max-[760px]:min-h-[500px]">
            <img src="/img/campaign.jpg" alt={t('campaignAlt')}
                 className="size-full object-cover brightness-[.65] saturate-[.72]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] tracking-[.25em]">COMING SOON</span>
                <h2 className="my-5 text-[clamp(36px,5vw,66px)] font-medium leading-[1.25] tracking-[.08em]">KINU 2026<br />{t('campaignTitle')}</h2>
                <p className="mb-2.5 text-base tracking-[.2em]">{t('onSaleSoon')}</p>
                <strong className="text-xs font-normal tracking-[.2em]">2026.10.15</strong>
            </div>
        </section>
        </div>
    )
}

export default Home;
